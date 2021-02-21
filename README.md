This is a QR code file-sharing Device vertical project for HackSC '21. Qtr is a mobile app developed in React Native with Expo (mainly tested on iOS) that enables users to transmit images, videos, PDFs, and files of all sort through QR codes. 

To test on your own device, clone the repository, run `npm install` and `expo install` to install the required packages.
Then, run `expo start` to run the project with Expo CLI, which then can be run on iOS or Android simulators.

The app utilizes a class of erasure codes known as Fountain Codes to ensure consistent data transmission amidst a noisy channel. Specifically, Qtr implements the LT algorithm (Luby Transform) of the different Fountain Codes.
