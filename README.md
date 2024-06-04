# NoDistractions (fork)

Fork of https://github.com/AsciiJakob/NoDistractions

I had some issues with building and code formatting so I started this fork to clean that up and then add some features I need.

## Added features

* Remember enabled status from when browser was last closed
* Option to hide the Close Tab button on the blocked page
* Light and dark theme for block page, using system preference

## Removed features

* Removed the setting "Enable on browser startup", because remembering the last enabled status is more useful and intuitive to me

## Planned features

* Show a small popup/indication when toggling with key shortcut
* CSS customization

## Build instruction

* `$ npm install` (first time)
* `$ npm run build:firefox`
    * zip file is under `web-ext-artifacts/`
