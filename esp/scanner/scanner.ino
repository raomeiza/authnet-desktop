/*
* AUTHOR: 	R A Omeiza (github.com/raomeiza)
* Developed for: 	esp32 with grow's fingerprint sensors. tested especially on r307s
* This example demonstrates how to enroll fingerprints, search the database for a match, and delete fingerprints.
*/
#if defined(ARDUINO_ARCH_ESP32)
#include <HardwareSerial.h>
#else
#include <SoftwareSerial.h>
#endif

#include <fpm.h>
 
/* Uncomment this definition only if your sensor supports the LED control commands (FPM_LEDON and FPM_LEDOFF)
 * and you want to control the LED yourself. */
/* #define FPM_LED_CONTROL_ENABLED */

#if defined(ARDUINO_ARCH_ESP32)
/*  For ESP32 only, use Hardware UART1:
    GPIO-25 is Arduino RX <==> Sensor TX
    GPIO-32 is Arduino TX <==> Sensor RX
*/
HardwareSerial fserial(1);
#else
/*  pin #2 is Arduino RX <==> Sensor TX
 *  pin #3 is Arduino TX <==> Sensor RX
 */
SoftwareSerial fserial(2, 3);
#endif

#define IMAGE_SZ	36864UL
uint8_t imageBuffer[IMAGE_SZ];

/* for convenience */
FPM finger(&fserial);
FPMSystemParams params;

bool processing = false;
/* for convenience */
#define PRINTF_BUF_SZ   40
char printfBuf[PRINTF_BUF_SZ];

void setup()
{
    Serial.begin(57600);
    
#if defined(ARDUINO_ARCH_ESP32)
    fserial.begin(57600, SERIAL_8N1, 25, 32);
#else
    fserial.begin(57600);
#endif

    Serial.println("ENROLL example");

    if (finger.begin()) {
        finger.readParams(&params);
        String json = "{\"capacity\": " + String(params.capacity) + ", \"packetLength\": " + String(FPM::packetLengths[static_cast<uint8_t>(params.packetLen)]) + "}";        // send the result to the serial
        // sendResult("details", "Fingerprint details", json);
    } 
    else {
        Serial.println("Did not find fingerprint sensor :(");
        while (1) yield();
    }
}

bool getFreeId(int16_t *fid, String command = "enroll")
{
    processing = true;
    for (int page = 0; page < (params.capacity / FPM_TEMPLATES_PER_PAGE) + 1; page++)
    {
        FPMStatus status = finger.getFreeIndex(page, fid);

        switch (status)
        {
        case FPMStatus::OK:
            if (*fid != -1)
            {
                // Serial.print("Free slot at ID ");
                // Serial.println(*fid);
                return true;
            }
            break;

        default:
            sendError(command, "Failed to get free ID", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
            return false;
        }

        yield();
    }

    // Serial.println("No free slots!");
    processing = false;
    return false;
}


void loop()
{
    if (Serial.available() > 0 && !processing)
    {
        String command = Serial.readStringUntil('\n');
        command.trim(); // Remove any leading/trailing whitespace
        // sendMessage("Received command: " + command);
        if(processing) {
            // sendError("info", "Command ignored", "The sensor is currently processing another command.");
            return;
        }
        if (command.startsWith("enroll"))
        {
            int16_t fid;
            if (getFreeId(&fid))
            {
                enrollFinger(fid);
            }
            else
            {
                sendError("infor", "Failed to get free ID", "No free slots available.");
            }
        }
        else if (command.startsWith("search"))
        {
            searchDatabase();
        }
        else if (command.startsWith("delete"))
        {
            int idIndex = command.indexOf(' ') + 1;
            if (idIndex > -1 && idIndex < command.length())
            {
                String idStr = command.substring(idIndex);
                int fid = idStr.toInt();
                if (fid > -1 && fid < params.capacity)
                {
                    deleteFingerprint(fid);
                }
                else
                {
                    sendError("infor", "Invalid ID provided", "ID must be a positive integer, less than or equal to the sensor's capacity of " + String(params.capacity));
                }
            }
            else
            {
                sendError("infor", "No ID provided", "Please provide the ID of the fingerprint to delete.");
            }
        }
        else if (command.startsWith("image"))
        {
            imageToBuffer();
        }
        else if (command.startsWith("details"))
        {
            getFingerprintSensorDetails();
        }
        else if (command.startsWith("match"))
        {
            int idIndex = command.indexOf(' ') + 1;
            if (idIndex > -1 && idIndex < command.length())
            {
                String idStr = command.substring(idIndex);
                int fid = idStr.toInt();
                if (fid > -1 && fid < params.capacity)
                {
                    matchFingerprint(fid);
                }
                else
                {
                    sendError("info", "Invalid ID provided", "ID must be a positive integer, less than or equal to the sensor's capacity of " + String(params.capacity));
                }
            }

            else
            {
                sendError("info", "No ID provided", "Please provide the ID of the fingerprint to match.");
            }
        }
        // else if command starts with clear, empty the fingerprint database
        else if (command.startsWith("clear"))
        {
            emptyDatabase();
        }
        else
        {
            sendError("info", "Invalid command " + command, "Please enter a valid command.");
            sendError("info", "Valid commands", "enroll, search, delete, image, details, match, stop, clear");
        }

        // Clear the serial buffer
        while (Serial.read() != -1)
            ;
    }

    yield();
}

bool enrollFinger(int16_t fid) 
{
    // Set the processing flag to true
    processing = true;

    FPMStatus status;
    const int NUM_SNAPSHOTS = 1;
    int fingerReqTimestamp = millis();
    #if defined(FPM_LED_CONTROL_ENABLED)
        finger.ledOn();
    #endif

    /* Take snapshots of the finger,
     * and extract the fingerprint features from each image */
    for (int i = 0; i < NUM_SNAPSHOTS; i++)
    {
        sendMessage("Place finger on sensor.");
        do {
            // sendMessage("countdown: " + String(millis() - fingerReqTimestamp) + "ms");
            // it it has been more than 30 seconds since the last finger request, terminate the process and send an error
            if (millis() - fingerReqTimestamp > 30000)
            {
                sendError("enroll", "Fingerprint enrollment timed out", "{\"message\": \"Please try again.\"}");
                // set the processing flag to false
                processing = false;
                return false;
            }
            #if defined(FPM_LED_CONTROL_ENABLED)
                status = finger.getImageOnly();
            #else
                status = finger.getImage();
            #endif
            
            switch (status) 
            {
                case FPMStatus::OK:
                    // reset the timestamp
                    fingerReqTimestamp = millis();
                    // sendMessage("Image taken.");
                    // // Send the captured image to the Electron app
                    // sendImageBuffer();
                    break;
                    
                case FPMStatus::NOFINGER:
                    // sendMessage("Place finger on sensor.");
                    break;
                    
                default:
                    // reset the timestamp
                    fingerReqTimestamp = millis();
                    /* allow retries even when an error happens */
                    sendMessage("Failed to capture image.");
                    break;
            }
            
            yield();
        }
        while (status != FPMStatus::OK);

        status = finger.image2Tz(i+1);
        
        switch (status) 
        {
            case FPMStatus::OK:
                //sendMessage("Image converted.");
                break;
                
            default:
                sendError("enroll", "Failed to extract fingerprint features", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
                // set the processing flag to false
                processing = false;
                return false;
        }

        // Only ask to remove finger if we need more snapshots
        if (i < NUM_SNAPSHOTS - 1) {
            sendMessage("Remove finger.");
            delay(1000);
            do {
                #if defined(FPM_LED_CONTROL_ENABLED)
                    status = finger.getImageOnly();
                #else
                    status = finger.getImage();
                #endif
                delay(200);
            }
            while (status != FPMStatus::NOFINGER);
        }
    }
    
    #if defined(FPM_LED_CONTROL_ENABLED)
        finger.ledOff();
    #endif

    /* Handle template generation based on number of snapshots */
    if (NUM_SNAPSHOTS == 1) {
        // For single snapshot, use the template from buffer 1 directly
        // sendMessage("Creating template from single image.");
        
        // Check if we need to search for duplicates first
        uint16_t fid2, score;
        status = finger.searchDatabase(&fid2, &score);
        
        switch (status)
        {
            case FPMStatus::OK:
                sendError("enroll", "Fingerprint already exists", "{\"id\": " + String(fid2) + ", \"score\": " + String(score) + "}");
                processing = false;
                return false;
                
            case FPMStatus::NOTFOUND:
                // Good, no duplicate found
                break;
                
            default:
                sendError("enroll", "Failed to search database", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
                processing = false;
                return false;
        }
        
        // Store the template directly from buffer 1
        status = finger.storeTemplate(fid, 1);
    } else {
        /* Multiple snapshots - create template from multiple images */
        status = finger.generateTemplate();
        switch (status)
        {
            case FPMStatus::OK:
                // sendMessage("Template created.");
                break;
                
            case FPMStatus::ENROLLMISMATCH:
                sendError("enroll", "Fingerprint mismatch", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
                processing = false;
                return false;
                
            default:
                sendError("enroll", "Failed to create template", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
                processing = false;
                return false;
        }

        // Search for duplicates
        uint16_t fid2, score;
        status = finger.searchDatabase(&fid2, &score);
        
        switch (status)
        {
            case FPMStatus::OK:
                sendError("enroll", "Fingerprint already exists", "{\"id\": " + String(fid2) + ", \"score\": " + String(score) + "}");
                processing = false;
                return false;
                
            case FPMStatus::NOTFOUND:
                // Serial.println("Did not find a match.");
                break;
                
            default:
                sendError("enroll", "Failed to search database", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
                processing = false;
                return false;
        }

        // Store the generated template
        status = finger.storeTemplate(fid);
    }
    
    // Check storage result
    switch (status)
    {
        case FPMStatus::OK:
            sendResult("enroll", "Fingerprint enrolled", "{\"id\": " + String(fid) + "}");
            break;
            
        case FPMStatus::BADLOCATION:
            sendError("enroll", "Failed to store template", "Bad location.");
            processing = false;
            return false;
            
        default:
            sendError("enroll", "Failed to store template", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
            processing = false;
            return false;
    }
    
    // set the processing flag to false
    processing = false;
    return true;
}

bool searchDatabase(void) 
{
    processing = true;
    FPMStatus status;
    
    /* Take a snapshot of the input finger */
    sendMessage("Place a finger on the scanner.");
    
    do {
        status = finger.getImage();
        
        switch (status) 
        {
            case FPMStatus::OK:
                // sendMessage("Image taken.");
                break;
                
            case FPMStatus::NOFINGER:
                // Serial.println(".");
                break;
                
            default:
                /* allow retries even when an error happens */
                sendError("search", "Failed to capture image", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
                break;
        }
        
        yield();
    }
    while (status != FPMStatus::OK);
    
    /* Extract the fingerprint features */
    status = finger.image2Tz();

    switch (status) 
    {
        case FPMStatus::OK:
            //sendMessage("Image converted.");
            break;
            
        default:
            sendError("search", "Failed to extract fingerprint features", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
            processing = false;
            return false;
    }

    /* Search the database for the converted print */
    uint16_t fid, score;
    status = finger.searchDatabase(&fid, &score);
    
    switch (status)
    {
        case FPMStatus::OK:
            sendResult("search", "Fingerprint found", "{\"id\": " + String(fid) + ", \"score\": " + String(score) + "}");
            break;
            
        case FPMStatus::NOTFOUND:
            sendError("search", "Fingerprint not found", "{\"message\": \"Fingerprint not found in database.\"}");
            processing = false;
            return false;
            
        default:
            sendError("search", "Failed to search database", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
            processing = false;
            return false;
    }
    
    /* Now wait for the finger to be removed, though not necessary. 
       This was moved here after the Search operation because of the R503 sensor, 
       whose searches oddly fail if they happen after the image buffer is cleared  */
    // sendMessage("Remove finger.");
    delay(1000);
    do {
        status = finger.getImage();
        delay(200);
    }
    while (status != FPMStatus::NOFINGER);
    processing = false;
    return true;
}


bool deleteFingerprint(int fid)
{
    // Set the processing flag to true
    processing = true;
    FPMStatus status = finger.deleteTemplate(fid);

    switch (status)
    {
    case FPMStatus::OK:
        sendResult("delete", "Fingerprint deleted", "{\"id\": " + String(fid) + "}");
        break;

    case FPMStatus::DELETEFAIL:
        sendError("delete", "Failed to delete fingerprint", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
        // set the processing flag to false
        processing = false;
        return false;

    default:
        sendError("delete", "Failed to delete fingerprint", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
        // set the processing flag to false
        processing = false;
        return false;
    }

    // set the processing flag to false
    processing = false;
    return true;
}

uint32_t imageToBuffer(void)
{
    // Set the processing flag to true
    processing = true;
    FPMStatus status;

    /* Take a snapshot of the finger */
   sendMessage("Place finger on sensor.");

    do
    {
        status = finger.getImage();

        switch (status)
        {
        case FPMStatus::OK:
            // Serial.println("Image taken.");
            break;

        case FPMStatus::NOFINGER:
            sendMessage("Place finger on sensor.");
            break;

        default:
            /* allow retries even when an error happens */
            sendError("imageToBuffer", "Failed to capture image", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
            break;
        }

        yield();
    } while (status != FPMStatus::OK);

    /* Initiate the image transfer */
    status = finger.downloadImage();

    switch (status)
    {
    case FPMStatus::OK:
        sendMessage("Starting image stream...");
        break;

    default:
        sendError("imageToBuffer", "Failed to download image", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
        // set the processing flag to false
        processing = false;
        return 0;
    }

    uint32_t totalRead = 0;
    uint16_t readLen = IMAGE_SZ;

    /* Now, the sensor will send us the image from its image buffer, one packet at a time */
    bool readComplete = false;

    while (!readComplete)
    {
        bool ret = finger.readDataPacket(imageBuffer + totalRead, NULL, &readLen, &readComplete);

        if (!ret)
        {
            sendError("imageToBuffer", "Failed to read image data", "Error reading image data. failed after " + String(totalRead) + " bytes.");
            // set the processing flag to false
            processing = false;
            return 0;
        }

        totalRead += readLen;
        readLen = IMAGE_SZ - totalRead;

        yield();
    }

    sendResult("imageToBuffer", "Image captured", "{\"bytes\": " + String(totalRead) + "}");

    // Send the buffer over serial
    Serial.write(imageBuffer, totalRead);

    // set the processing flag to false
    processing = false;
    return totalRead;
}

void sendImageBuffer(void)
{
    // Set the processing flag to true
    processing = true;
    FPMStatus status;

    /* Initiate the image transfer */
    status = finger.downloadImage();

    switch (status)
    {
    case FPMStatus::OK:
        sendMessage("Starting image stream...");
        break;

    default:
        sendError("imageToBuffer", "Failed to download image", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
        // set the processing flag to false
        processing = false;
        return;
    }

    uint32_t totalRead = 0;
    uint16_t readLen = IMAGE_SZ;

    /* Now, the sensor will send us the image from its image buffer, one packet at a time */
    bool readComplete = false;

    while (!readComplete)
    {
        bool ret = finger.readDataPacket(imageBuffer + totalRead, NULL, &readLen, &readComplete);
        
        if (!ret)
        {
            sendError("imageToBuffer", "Failed to read image data", "Error reading image data.");
            // set the processing flag to false
            processing = false;
            return;
        }

        // Stream the buffer over serial as it is received
        Serial.write(imageBuffer + totalRead, readLen);

        totalRead += readLen;
        readLen = IMAGE_SZ - totalRead;

        yield();
    }

    sendResult("sendImageToBuffer", "Image transferred", "{\"bytes\": " + String(totalRead) + "}");
    // set the processing flag to false
    processing = false;
}

// create a method that when called, gets the details of the fingerprint sensor and send it over.
// it should fully make use of the helper functions for sending messages, errors and results
void getFingerprintSensorDetails()
{
    // Set the processing flag to true
    processing = true;
    // create a variable to store the fingerprint details
    FPMSystemParams params;
    // get the fingerprint details
    FPMStatus status = finger.readParams(&params);
    // check if the status is ok
    if (status == FPMStatus::OK)
    {
        // create a json string
        String json = "{\"capacity\": " + String(params.capacity) + ", \"packetLength\": " + String(FPM::packetLengths[static_cast<uint8_t>(params.packetLen)]) + "}";        // send the result to the serial
        sendResult("details", "Fingerprint details", json);
    }
    else
    {
        // create an error message
        String message = "Failed to get fingerprint details";
        // create an error string
        String error = "error 0x" + String(static_cast<uint16_t>(status));
        // send the error to the serial
        sendError("details", message, error);
    }
    // set the processing flag to false
    processing = false;
}

// 1:1 fingerprint matching
bool matchFingerprint(uint16_t fid) 
{
    processing = true;
    FPMStatus status;
    
    /* Take a snapshot of the input finger */
    sendMessage("Place a finger on the scanner.");
    
    do {
        status = finger.getImage();
        
        switch (status) 
        {
            case FPMStatus::OK:
                // sendMessage("Image taken.");
                break;
                
            case FPMStatus::NOFINGER:
                // Serial.println(".");
                break;
                
            default:
                /* allow retries even when an error happens */
                sendError("match", "Failed to capture image", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
                break;
        }
        
        yield();
    }
    while (status != FPMStatus::OK);
    
    /* Extract the fingerprint features into Buffer 1 */
    status = finger.image2Tz(1);

    switch (status) 
    {
        case FPMStatus::OK:
            //sendMessage("Image converted.");
            break;
            
        default:
            sendError("match", "Failed to extract fingerprint features", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
            processing = false;
            return false;
    }
    
    /* Now wait for the finger to be removed */
    sendMessage("Remove finger.");
    delay(1000);
    do {
        status = finger.getImage();
        delay(200);
    }
    while (status != FPMStatus::NOFINGER);
    
    /* read the other template into Buffer 2 */
    status = finger.loadTemplate(fid, 2);
    
    switch (status) 
    {
        case FPMStatus::OK:
            // Serial.print("Template "); Serial.print(fid); Serial.println(" loaded");
            break;
            
        case FPMStatus::DBREADFAIL:
            sendError("match", "Failed to load template", "DB read failed.");
            processing = false;
            return false;
            
        default:
            sendError("match", "Failed to load template", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
            return false;
    }
    
    /* Compare the contents of both Buffers to see if they match */
    uint16_t score;
    status = finger.matchTemplatePair(&score);
    
    switch (status)
    {
        case FPMStatus::OK:
            sendResult("match", "Fingerprints match", "{\"score\": " + String(score) + "}");
            break;
            
        case FPMStatus::NOMATCH:
            sendError("match", "Fingerprints do not match", "No match found.");
            processing = false;
            return false;
            
        default:
            sendError("match", "Failed to match fingerprints", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
            processing = false;
            return false;
    }
    
    return true;
}

// create a method for emptying the fingerprint database
bool emptyDatabase(void) 
{
    FPMStatus status = finger.emptyDatabase();
    
    switch (status) 
    {
        case FPMStatus::OK:
            sendMessage("Database emptied successfully.");
            break;
            
        case FPMStatus::DBCLEARFAIL:
            sendError("clear", "Failed to clear database", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
            processing = false;
            return false;
            
        default:
            sendError("clear", "Failed to clear database", "{\"code\": " + String(static_cast<uint16_t>(status)) + "}");
            processing = false;
            return false;
    }
    processing = false;
    return true;
}

// // lets create a function for stoping the fingerprint sensor
// void stopFingerprintAction() {
//   // Custom command to stop the fingerprint sensor action
//   uint8_t stopCommand[] = {0xEF, 0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0x01, 0x00, 0x03, 0x0D, 0x00, 0x11};
//   uint16_t writeLen = sizeof(stopCommand) / sizeof(uint8_t);
//   FPMStatus status = finger.writePacket(stopCommand, NULL, &writeLen, FPM_COMMANDPACKET);
  
//   if (status == FPM_OK) {
//     Serial.println("Sent stop command to fingerprint sensor");
//   } else {
//     Serial.print("Failed to send stop command, error: ");
//     Serial.println(status);
//   }
// }

// lets create an error function that receives error parameters, formats it in stringed json format
// prints it to serial
void sendError(String command, String message, String error)
{
    // create a json string
String json = "{\"command\": \"" + command + "\", \"event\": \"error\", \"message\": \"" + message + "\", \"error\": " + error + "}";    // print the json string to serial
    Serial.println(json);
}

// create function that just prints message to the serial
void sendMessage(String message)
{
    // print the message to the serial
    String json = "{\"event\": \"message\", \"message\": \"" + message + "\"}";
    // print the json string to serial
    Serial.println(json);
}

// creaet a function to send result to the serial
void sendResult(String command, String message, String result)
{
    // create a json string
String json = "{\"command\": \"" + command + "\", \"event\": \"result\", \"message\": \"" + message + "\", \"result\": " + result + "}";    // print the json string to serial
    Serial.println(json);
}