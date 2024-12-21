#ifndef MONITOR_H
#define MONITOR_H

#ifdef MONITOR_EXPORTS
#define MONITOR_API __declspec(dllexport)
#else
#define MONITOR_API __declspec(dllimport)
#endif

typedef enum {
    MOUSE_MOVE = 0,
    MOUSE_LEFT_DOWN,
    MOUSE_LEFT_UP,
    MOUSE_RIGHT_DOWN,
    MOUSE_RIGHT_UP,
    MOUSE_MIDDLE_DOWN,
    MOUSE_MIDDLE_UP,
    MOUSE_SCROLL
} MouseEventType;

typedef enum {
    KEY_DOWN = 0,
    KEY_UP
} KeyboardEventType;

typedef void (*MouseCallbackFn)(double x, double y, int event_Type, int delta);
typedef void (*KeyboardCallbackFn)(int event_Type);
typedef void (*WindowFocusCallbackFn)(const char* window_title, const char* window_class, const char* process_name);

MONITOR_API void initialize(void);
MONITOR_API void start_mouse_monitoring(MouseCallbackFn callback);
MONITOR_API void start_keyboard_monitoring(KeyboardCallbackFn callback);
MONITOR_API void process_events(void);
MONITOR_API void cleanup(void);

#endif