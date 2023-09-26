# SOSlite - Send Our Steganographies (lite)

## About

This website is a locally-run steganography tool. It allows you to hide text into images in such a way that the image appears as normal. This is done through least significant bit encoding. The RGB values of each pixel are altered such that their least siginificant bit matches your text's binary value. But before that is even done, your text is encrypted with a password and then compressed so that even if someone knows you're hiding data in the image, they can't extract it. A SHA-256 hash of the image is also provided for verification, as sometimes messaging apps compress the image,
                rendering the hidden data unreadable.

This website is currently being hosted at: https://thisisyulinzheng.github.io/SOSlite/
