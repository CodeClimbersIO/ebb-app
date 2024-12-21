#define MONITOR_EXPORTS
#include "monitor.h"
#include <windows.h>
#include <stdio.h>

MouseCallbackFn g_mouse_callback = NULL;
KeyboardCallbackFn g_keyboard_callback = NULL;
WindowFocusCallbackFn g_focus_callback = NULL;

// Low-level mouse hook procedure
LRESULT CALLBACK LowLevelMouseProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode == HC_ACTION && g_mouse_callback != NULL) {
        MSLLHOOKSTRUCT* hookStruct = (MSLLHOOKSTRUCT*)lParam;
        double x = (double)hookStruct->pt.x;
        double y = (double)hookStruct->pt.y;
                int event_type = 0;  // Default to MOUSE_MOVE
        int scroll_delta = 0;
        switch (wParam) {
            case WM_MOUSEMOVE:
                event_type = MOUSE_MOVE;
                printf("Mouse Move - ");
                break;
                
            case WM_LBUTTONDOWN:
                event_type = MOUSE_LEFT_DOWN;
                printf("Left Down - ");
                break;
                
            case WM_LBUTTONUP:
                event_type = MOUSE_LEFT_UP;
                printf("Left Up - ");
                break;
                
            case WM_RBUTTONDOWN:
                event_type = MOUSE_RIGHT_DOWN;
                printf("Right Down - ");
                break;
                
            case WM_RBUTTONUP:
                event_type = MOUSE_RIGHT_UP;
                printf("Right Up - ");
                break;
                
            case WM_MBUTTONDOWN:
                event_type = MOUSE_MIDDLE_DOWN;
                printf("Middle Down - ");
                break;
                
            case WM_MBUTTONUP:
                event_type = MOUSE_MIDDLE_UP;
                printf("Middle Up - ");
                break;
                
            case WM_MOUSEWHEEL:
                event_type = MOUSE_SCROLL;
                scroll_delta = GET_WHEEL_DELTA_WPARAM(hookStruct->mouseData) / WHEEL_DELTA;
                printf("Scroll (delta: %.2f) - ", scroll_delta);
                break;
                
            default:
                return CallNextHookEx(NULL, nCode, wParam, lParam);
        }

        g_mouse_callback(x, y, event_type, scroll_delta);
    }
    return CallNextHookEx(NULL, nCode, wParam, lParam);
}


// New: Low-level keyboard hook procedure
LRESULT CALLBACK LowLevelKeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode == HC_ACTION && g_keyboard_callback != NULL) {
        KBDLLHOOKSTRUCT* hookStruct = (KBDLLHOOKSTRUCT*)lParam;
        int event_type = 0;
        switch (wParam) {
        case WM_KEYDOWN:
        case WM_SYSKEYDOWN:
            event_type = KEY_DOWN;
            break;
        case WM_KEYUP:
        case WM_SYSKEYUP:
            event_type = KEY_UP;
            break;
        default:
            return CallNextHookEx(NULL, nCode, wParam, lParam);
        }
        g_keyboard_callback(event_type);
    }
    return CallNextHookEx(NULL, nCode, wParam, lParam);
}

// Callback for window focus changes
void CALLBACK WinEventProc(
    HWINEVENTHOOK hWinEventHook,
    DWORD event,
    HWND hwnd,
    LONG idObject,
    LONG idChild,
    DWORD dwEventThread,
    DWORD dwmsEventTime
) {
    if (event == EVENT_SYSTEM_FOREGROUND && g_focus_callback != NULL) {
        char title[256];
        char class_name[256];
        
        // Get window title
        GetWindowTextA(hwnd, title, sizeof(title));
        // Get window class name
        GetClassNameA(hwnd, class_name, sizeof(class_name));
        
        // Get process name
        DWORD process_id;
        GetWindowThreadProcessId(hwnd, &process_id);
        
        char process_name[MAX_PATH] = "";
        HANDLE process_handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, process_id);
        if (process_handle != NULL) {
            GetModuleFileNameExA(process_handle, NULL, process_name, MAX_PATH);
            CloseHandle(process_handle);
        }
        
        // Call the callback with the window information
        g_focus_callback(title, class_name, process_name);
    }
}

HHOOK g_mouse_hook = NULL;
HHOOK g_keyboard_hook = NULL;
HWINEVENTHOOK g_focus_hook = NULL;

__declspec(dllexport) void initialize(void) {
}

// Start monitoring mouse movements
__declspec(dllexport) void start_mouse_monitoring(MouseCallbackFn callback) {
    g_mouse_callback = callback;
    g_mouse_hook = SetWindowsHookEx(
        WH_MOUSE_LL,
        LowLevelMouseProc,
        GetModuleHandle(NULL),
        0
    );
    
    if (g_mouse_hook == NULL) {
        fprintf(stderr, "Failed to set mouse hook. Error code: %lu\n", GetLastError());
    }
}

// Start monitoring keyboard
__declspec(dllexport) void start_keyboard_monitoring(KeyboardCallbackFn callback) {
    g_keyboard_callback = callback;
    g_keyboard_hook = SetWindowsHookEx(
        WH_KEYBOARD_LL,
        LowLevelKeyboardProc,
        GetModuleHandle(NULL),
        0
    );
    
    if (g_keyboard_hook == NULL) {
        fprintf(stderr, "Failed to set keyboard hook. Error code: %lu\n", GetLastError());
    }
}

__declspec(dllexport) void start_window_monitoring(WindowFocusCallbackFn callback) {
    g_focus_callback = callback;
    
    // Set up the event hook for foreground window changessasdASASD
    g_focus_hook = SetWinEventHook(
        EVENT_SYSTEM_FOREGROUND,  // Event to start monitoring
        EVENT_SYSTEM_FOREGROUND,  // Event to stop monitoring
        NULL,                     // Handle to DLL for hook function
        WinEventProc,            // Hook callback function
        0,                       // Process ID (0 = all processes)
        0,                       // Thread ID (0 = all threads)
        WINEVENT_OUTOFCONTEXT    // Hook mode
    );
    
    if (g_focus_hook == NULL) {
        fprintf(stderr, "Failed to set focus hook. Error code: %lu\n", GetLastError());
    }
}

__declspec(dllexport) void process_events(void) {
    MSG msg;
    while (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
}

__declspec(dllexport) void cleanup(void) {
    printf("WINDOWS CLEANUP");
    if (g_mouse_hook != NULL) {
        UnhookWindowsHookEx(g_mouse_hook);
        g_mouse_hook = NULL;
    }
    if (g_keyboard_hook != NULL) {
        UnhookWindowsHookEx(g_keyboard_hook);
        g_keyboard_hook = NULL;
    }
    if (g_focus_hook != NULL) {
        UnhookWinEvent(g_focus_hook);
        g_focus_hook = NULL;
    }
}