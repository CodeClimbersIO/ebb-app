# Ebb 

Ebb is a desktop focus app for builders and creatives who seek more undistracted deep work. Quickly start focus sessions, block distracting apps, track your time, incorporate music into your workflow, and stay accountable with friends.

## How it works

Ebb uses your window, mouse and keyboard activity to track your workflow habits. These activities are then rolled up into activity states, which are then used to generate working sessions to help you understand your workflow habits and improve your productivity.


## How to use

Ebb is a desktop application that runs on your computer. It is designed to be used in a distraction-free environment, so it is recommended that you use it in a dedicated workspace.

<!-- To start using Ebb, simply download the application from the [releases page](https://github.com/ebb-ai/ebb/releases) and run it. -->

## What do we do with your data?
- First, any data that contains sensitive information like app names, window names, mouse movements, keyboard interaction, is NOT shared with or stored by us. This all stays on your personal device.
- In order to easily offer you with a convenient solution to understand and improve your work habits, we do store your scores, sessions, streaks, and friends.
- We do not share this data with third parties
- We give you full control to remove your profile from our system at anytime

## Open Source
- The tracking engine that powers Ebb is an Open Source project we maintain called CodeClimbers. We believe there are improvements that need to be made to the technology that supports tracking and we are pushing those developments as open source and local first.


# [Monitoring Service](https://github.com/CodeClimbersIO/os-monitor-service)

The monitoring service is a Rust application that runs on your computer and is responsible for recording your activities. It is designed to be run as a background service and will not interfere with your workflow. Makes use of the os-monitor crate to monitor your activities and then record them to the database on your device.

# [Monitor](https://github.com/CodeClimbersIO/os-monitor)
The monitor is a Rust application that runs on your computer and is responsible for monitoring your activities. It is specifically responsible for monitoring (but not recording) your window, mouse and keyboard activity.
