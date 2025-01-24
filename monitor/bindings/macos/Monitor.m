// Monitor.m

#import "Monitor.h"
#import <objc/runtime.h>
#import <Cocoa/Cocoa.h>
#import <ApplicationServices/ApplicationServices.h>

@interface MonitorHolder : NSObject
@property (nonatomic, strong) NSArray<id> *monitors;
@property (nonatomic, assign) MouseEventCallback mouseCallback;
@property (nonatomic, assign) WindowEventCallback windowCallback;
@end

@implementation MonitorHolder
@end

static MonitorHolder *monitorHolder = nil;
static NSString* getAXErrorDescription(AXError error) {
    switch (error) {
        case kAXErrorCannotComplete:           
            return @"Cannot complete the operation (window might be transitioning)";
        case kAXErrorNotImplemented:           
            return @"The accessibility feature is not implemented";
        case kAXErrorInvalidUIElement:         
            return @"Invalid UI element";
        case kAXErrorFailure:                  
            return @"Operation failed";
        case kAXErrorIllegalArgument:          
            return @"Illegal argument";
        case kAXErrorNoValue:                 
            return @"No value available";
        case kAXErrorAPIDisabled:              
            return @"Accessibility API disabled";
        case kAXErrorNotificationUnsupported:  
            return @"Notification not supported";
        default:
            return [NSString stringWithFormat:@"Unknown error code: %d", (int)error];
    }
}


BOOL isDomain(NSString *str) {
    NSString *pattern = @"^(?:https?:\\/\\/)?(?:www\\.)?[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*\\.[a-zA-Z]{2,}(?:\\/[^\\s]*)?(?:\\?[^\\s]*)?$";
    NSError *error = nil;
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:pattern
                                                                         options:0
                                                                           error:&error];
    if (error) {
        return NO;
    }
    
    NSRange range = NSMakeRange(0, [str length]);
    NSArray *matches = [regex matchesInString:str options:0 range:range];
    
    return matches.count > 0;
}

/**
* Find the URL element in the given accessibility element. Recursively searches through children.
* Assumes that the URL element is a static text or a text field. 
* TODO: future versions might need to search specifically based on the browser
* @param element The accessibility element to search
* @return The URL element if found, otherwise NULL
*/
AXUIElementRef findUrlElement(AXUIElementRef element) {
    if (!element) return NULL;
    
    CFStringRef roleRef;
    AXUIElementCopyAttributeValue(element, kAXRoleAttribute, (CFTypeRef *)&roleRef);
    NSString *role = (__bridge_transfer NSString *)roleRef;
    
    if ([role isEqualToString:NSAccessibilityStaticTextRole] || [role isEqualToString:NSAccessibilityTextFieldRole]) {
        CFTypeRef valueRef;
        AXError error = AXUIElementCopyAttributeValue(element, kAXValueAttribute, &valueRef);
        if (error == kAXErrorSuccess) {
            NSString *value = (__bridge_transfer NSString *)valueRef;
            if (isDomain(value)) {
                CFRetain(element);
                return element;
            }
        }
    }
    
    CFArrayRef childrenRef;
    AXError childrenError = AXUIElementCopyAttributeValue(element, kAXChildrenAttribute, (CFTypeRef *)&childrenRef);
    
    if (childrenError == kAXErrorSuccess) {
        NSArray *children = (__bridge_transfer NSArray *)childrenRef;
        for (id child in children) {
            AXUIElementRef urlElement = findUrlElement((__bridge AXUIElementRef)child);
            if (urlElement != NULL) {
                return urlElement;
            }
        }
    }
    
    return NULL;
}

BOOL checkAccessibilityPermissions(void) {
    NSDictionary *options = @{(__bridge id)kAXTrustedCheckOptionPrompt: @YES};
    BOOL trusted = AXIsProcessTrustedWithOptions((__bridge CFDictionaryRef)options);
    
    return trusted;
}

BOOL isSupportedBrowser(NSString *bundleId) {
    // return true;
    return [bundleId isEqualToString:@"com.apple.Safari"] ||
           [bundleId isEqualToString:@"com.google.Chrome"] ||
           [bundleId isEqualToString:@"com.microsoft.Edge"] ||
           [bundleId isEqualToString:@"com.google.Chrome.canary"] ||
           [bundleId isEqualToString:@"com.google.Chrome.beta"] ||
           [bundleId isEqualToString:@"company.thebrowser.Browser"];
}

WindowTitle* detect_focused_window(void) {
    if (!checkAccessibilityPermissions()) {
        return nil;
    }

        
    // Create system-wide accessibility element
    // Get the frontmost application process first
    NSRunningApplication *frontmostApp = [[NSWorkspace sharedWorkspace] frontmostApplication];
    
    if (!frontmostApp) {
        NSLog(@"Failed to get frontmost application");
        return nil;
    }
    NSString *bundleId = frontmostApp.bundleIdentifier;
    
    // Create an accessibility element for the specific application
    AXUIElementRef appRef = AXUIElementCreateApplication(frontmostApp.processIdentifier);
    if (!appRef) {
        NSLog(@"Failed to create accessibility element for application");
        return nil;
    }
    
    // Get focused window
    AXUIElementRef focusedWindow;
    AXError result = AXUIElementCopyAttributeValue(
        appRef,
        kAXFocusedWindowAttribute,
        (CFTypeRef *)&focusedWindow
    );
    
    if (result != kAXErrorSuccess) {
        NSLog(@"Debug - Raw error code: %d, kAXErrorCannotComplete: %d", 
            (int)result, (int)kAXErrorCannotComplete);
        NSLog(@"Failed to get focused window: %@ (error code: %d)", 
            getAXErrorDescription(result), result);
        CFRelease(appRef);
        return nil;
    }
    
    // Get window title
    CFTypeRef windowTitle;
    result = AXUIElementCopyAttributeValue(
        focusedWindow,
        kAXTitleAttribute,
        &windowTitle
    );

    NSString *url = nil;
    if (isSupportedBrowser(bundleId)) {
        AXUIElementRef urlElement = findUrlElement(focusedWindow);
        if (urlElement) {
            CFTypeRef valueRef;
            AXUIElementCopyAttributeValue(urlElement, kAXValueAttribute, &valueRef);
            url = (__bridge_transfer NSString *)valueRef;
        }
    }
    
    if (result == kAXErrorSuccess) {
        NSString *title = (__bridge_transfer NSString *)windowTitle;
        NSString *applicationName = frontmostApp.localizedName; 
        WindowTitle* windowTitleStruct = malloc(sizeof(WindowTitle));
        windowTitleStruct->window_title = strdup([title UTF8String]);
        windowTitleStruct->app_name = strdup([applicationName UTF8String]);
        windowTitleStruct->url = url ? strdup([url UTF8String]) : NULL;
        
        // Clean up
        CFRelease(focusedWindow);
        CFRelease(appRef);
        
        return windowTitleStruct;
    } else {
        NSLog(@"Debug - Raw error code: %d, kAXErrorCannotComplete: %d", 
            (int)result, (int)kAXErrorCannotComplete);
        NSLog(@"Failed to get window title: %@ (error code: %d)", 
            getAXErrorDescription(result), result);
        CFRelease(appRef);
        return nil;
    }
    
    // Clean up
    CFRelease(focusedWindow);
    CFRelease(appRef);
    return nil;
}

void start_mouse_monitoring(MouseEventCallback callback) {
    if (!monitorHolder) {
        monitorHolder = [[MonitorHolder alloc] init];
    }
    monitorHolder.mouseCallback = callback;
    
    NSMutableArray *monitors = [NSMutableArray array];
    
    // Mouse move monitor
    id moveMonitor = [NSEvent addGlobalMonitorForEventsMatchingMask:NSEventMaskMouseMoved 
                                                          handler:^(NSEvent *event) {
        callback(event.locationInWindow.x,
                event.locationInWindow.y,
                MouseEventTypeMove,
                0);
    }];
    if (moveMonitor) {
        [monitors addObject:moveMonitor];
    }
    
    // Click monitor
    NSEventMask clickMask = NSEventMaskLeftMouseDown | NSEventMaskLeftMouseUp |
                           NSEventMaskRightMouseDown | NSEventMaskRightMouseUp |
                           NSEventMaskOtherMouseDown | NSEventMaskOtherMouseUp;
    id clickMonitor = [NSEvent addGlobalMonitorForEventsMatchingMask:clickMask
                                                           handler:^(NSEvent *event) {
        MouseEventType eventType;
        switch (event.type) {
            case NSEventTypeLeftMouseDown:
                eventType = MouseEventTypeLeftDown;
                break;
            case NSEventTypeLeftMouseUp:
                eventType = MouseEventTypeLeftUp;
                break;
            case NSEventTypeRightMouseDown:
                eventType = MouseEventTypeRightDown;
                break;
            case NSEventTypeRightMouseUp:
                eventType = MouseEventTypeRightUp;
                break;
            case NSEventTypeOtherMouseDown:
                eventType = MouseEventTypeMiddleDown;
                break;
            case NSEventTypeOtherMouseUp:
                eventType = MouseEventTypeMiddleUp;
                break;
            default:
                return;
        }
        callback(event.locationInWindow.x,
                event.locationInWindow.y,
                eventType,
                0);
    }];
    if (clickMonitor) {
        [monitors addObject:clickMonitor];
    }
    
    // Scroll monitor
    id scrollMonitor = [NSEvent addGlobalMonitorForEventsMatchingMask:NSEventMaskScrollWheel
                                                            handler:^(NSEvent *event) {
        callback(event.locationInWindow.x,
                event.locationInWindow.y,
                MouseEventTypeScroll,
                (int32_t)event.scrollingDeltaY);
    }];
    if (scrollMonitor) {
        [monitors addObject:scrollMonitor];
    }
    monitorHolder.monitors = monitors;
}

void start_keyboard_monitoring(KeyboardEventCallback callback) {
    if (!monitorHolder) {
        monitorHolder = [[MonitorHolder alloc] init];
    }
    
    id keyboardMonitor = [NSEvent addGlobalMonitorForEventsMatchingMask:NSEventMaskKeyDown
                                                               handler:^(NSEvent *event) {
        callback((int32_t)event.keyCode);
    }];
    
    if (keyboardMonitor) {
        if (!monitorHolder.monitors) {
            monitorHolder.monitors = @[];
        }
        monitorHolder.monitors = [monitorHolder.monitors arrayByAddingObject:keyboardMonitor];
    }
}

void initialize(void) {
    printf("Initializing\n");
    [[NSApplication sharedApplication] setActivationPolicy:NSApplicationActivationPolicyAccessory];
}

void process_events(void) {
    @try {
        if (![NSThread isMainThread]) {
            printf("Warning: process_events called from background thread!\n");
        }
        // printf("Processing events in objective-c\n");
        // printf("Until: %p\n", until);
        NSDate *until = [NSDate dateWithTimeIntervalSinceNow:0.1];  // 100ms collection window
        NSEvent *event;
        while ((event = [[NSApplication sharedApplication] 
                nextEventMatchingMask:NSEventMaskAny
                untilDate:until  // Changed from nil to until
                inMode:NSDefaultRunLoopMode
                dequeue:YES])) {
            [[NSApplication sharedApplication] sendEvent:event];
        }
    }
    @catch (NSException *exception) {
        printf("EXCEPTION during event processing: %s - %s\n", 
            [exception.name UTF8String], 
            [exception.reason UTF8String]);
        
        // Print the stack trace
        NSArray *callStack = [exception callStackSymbols];
        printf("Stack trace:\n");
        for (NSString *symbol in callStack) {
            printf("%s\n", [symbol UTF8String]);
        }
    }
}

void cleanup(void) {
    if (monitorHolder) {
        for (id monitor in monitorHolder.monitors) {
            [NSEvent removeMonitor:monitor];
        }
        monitorHolder.monitors = nil;
        monitorHolder = nil;
    }
}