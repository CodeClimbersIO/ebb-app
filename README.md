# Ebb 

Ebb is a productivity tool that accelerates your potential by giving you insights into your workflow habits and providing working sessions to help you stay focused and productive.

## How it works

Ebb uses your window, mouse and keyboard activity to track your workflow habits. These activities are then rolled up into activity states, which are then used to generate working sessions to help you understand your workflow habits and improve your productivity.


## How to use

Ebb is a desktop application that runs on your computer. It is designed to be used in a distraction-free environment, so it is recommended that you use it in a dedicated workspace.

<!-- To start using Ebb, simply download the application from the [releases page](https://github.com/ebb-ai/ebb/releases) and run it. -->

## What do we do with your data?
- First, any data that contains sensitive information like app names, window names, mouse movements, keyboard interaction, is NOT shared with or stored by us. This all stays on your personal device.
- In order to easily offer you with a convenient solution to understand and improve your work habits, we do store your scores, sessions, streaks and friends.
- We also believe in offering you with the best scoring and to do that, we share that same data--anonymized--with interceptlabs to help them better understand how our flow scores correlate with productivity seen in a lab environment
- We do not share your data with other third parties.
- We give you full control to remove your profile from our system at anytime

## Open Source
- The tracking engine that powers Ebb is an Open Source project we maintain called CodeClimbers. We believe that there are improvements that need to be made to the technology that supports tracking and we are pushing those developments as open source.


# [Monitoring Service](monitoring-service/Readme.md)

The monitoring service is a Rust application that runs on your computer and is responsible for recording your activities. It is designed to be run as a background service and will not interfere with your workflow. Makes use of the [monitor](monitor/Readme.md) crate to monitor your activities and then record them to the database on your device.

# [Monitor](monitor/Readme.md)
The monitor is a Rust application that runs on your computer and is responsible for monitoring your activities. It is specifically responsible for monitoring (but not recording) your window, mouse and keyboard activity.
