/*
 * File: plugin.js
 * Project: steam-comment-service-bot
 * Created Date: 25.02.2022 09:37:57
 * Author: 3urobeat
 *
 * Last Modified: 2025-02-04 12:17:31
 * Modified By: 3urobeat
 */


let logger = require("output-logger");

// Note: These paths will break when the plugin is loaded. Use them only while developing using 'npm link' for IntelliSense as described here: https://github.com/3urobeat/steam-comment-service-bot/blob/master/docs/wiki/creating_plugins.md#additional-information
//const PluginSystem = require("../steam-comment-service-bot/src/pluginSystem/pluginSystem.js"); // eslint-disable-line
//const Bot          = require("../steam-comment-service-bot/src/bot/bot.js");                   // eslint-disable-line
// Do not forget to comment them out when publishing your plugin!

const pluginPackage = require("./package.json"); // eslint-disable-line


/**
 * Constructor - Creates a new object for this plugin
 * @class
 * @param {PluginSystem} sys Your connector to the application
 */
const Plugin = function(sys) {
    logger = sys.controller.logger; // Overwrites logger function from lib with our modified one. Import above remains to keep IntelliSense support

    // Store references to commonly used properties
    this.sys            = sys;
    this.controller     = sys.controller;
    this.data           = sys.controller.data;
    this.commandHandler = sys.commandHandler;
};

// Export everything in this file to make it accessible to the plugin loader
module.exports = Plugin;


/**
 * This function will be called by the plugin loader after updating but before logging in. Initialize your plugin here.
 */
Plugin.prototype.load = async function() {
    this.pluginConfig = await this.sys.loadPluginConfig(pluginPackage.name); // Load your config

    logger("info", "Hello World!"); // Log something for example. This will be logged instantly but only appear after ready because of the readyafterlogs system.


    // Write some data to a test file for example. You should handle errors here of course
    await this.sys.writePluginData(pluginPackage.name, "test.txt", "Random test data\nwhich should be stored in this file!");


    // Example of adding a command that will respond with "Hello World!" on "hello" or "cool-alias"
    this.commandHandler.registerCommand({
        names: ["hello", "cool-alias"],
        description: "Responds with Hello World!",
        ownersOnly: false,

        run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
            respondModule(context, resInfo, "Hello world!");

            // Example of using the delete function to delete the test.txt we created earlier again
            this.sys.deletePluginData(pluginPackage.name, "test.txt");
        }
    });
};



/**
 * This function will be called when the bot is ready (aka all accounts were logged in).
 */
Plugin.prototype.ready = async function() {

    logger("info", "I am the plugin and we seem to be ready!");


    // Read the data we previously wrote in load()
    let testData = await this.sys.loadPluginData(pluginPackage.name, "test.txt");
    logger("info", "Template Plugin: Read what we just wrote: " + testData);


    // Example of pretending the first owner used the '!ping' command
    let firstOwnerSteamID = this.data.cachefile.ownerid[0]; // Get first ownerid from cache to make sure it was converted to a steamID64

    const runResponse = await this.commandHandler.runCommand(
        "ping",                               // Name of the command to run
        [],                                   // Arguments provided by the user (ping does not take any in this case), Check the commands documentation to see which cmd takes which arguments: https://github.com/3urobeat/steam-comment-service-bot/blob/master/docs/wiki/commands_doc.md
        this.controller.main.sendChatMessage, // The function that should handle sending the reponse. In this case we can simply use sendChatMessage(), implemented by the bot itself, to send a Steam Chat message
        this.controller.main,                 // Context (`this.`) used inside the respondModule function (sendChatMessage() in this case). The bot implements sendChatMessage() inside the Bot class and it expects to be called from there, which is why we pass the main bot account here. This will lead to the first bot account being used to send the message.
        {
            userID: firstOwnerSteamID,        // resInfo object, containing additional information for `respondModule` about the response to send, as outlined in the typedef. This userID specifies where sendChatMessage() should send the response to.
            fromSteamChat: true               // Used in this scenario to signal the bot that the userID is in fact a SteamID to suppress a warning. The bot checks if you attempt to run a command without providing ownerIDs, as that will bypass any and all owner privilege checks.
        }                                     // Check out the typedef (which your IntelliSense should show, or open `commandHandler.js` from the Bot's codebase) for more information about the resInfo parameter.
    );
    // Note: This does seem to throw a RateLimitExceeded error which even a large delay doesn't fix. The retry works however. Idk, I think Steam might be at fault. // TODO: or is this a context related problem?

    // Check whether runCommand declined the request instantly. The respondModule parameter (where we provided 'this.controller.main.sendChatMessage' above) won't ever be called, as only a command itself will use it to communicate back.
    if (!runResponse.success) {
        logger("error", `Template Plugin: Failed to run command '!ping'! Reason: '${runResponse.reason}' | Message: '${runResponse.message}'`);
    }
};


/**
 * This function is called when the !reload command is executed
 * This plugin doesn't really have anything that needs to be unloaded (for example shutting down a webserver) but including an empty function will suppress a warning.
 */
Plugin.prototype.unload = function () {};


const Bot = require("../../src/bot/bot.js"); // eslint-disable-line

/**
 * Called when a bot account changes it status
 * @param {Bot} bot The bot object that changed status
 * @param {Bot.EStatus} oldStatus The old status it had
 * @param {Bot.EStatus} newStatus The new status it now has
 */
Plugin.prototype.statusUpdate = function(bot, oldStatus, newStatus) {

    // Use EStatus[] to log name of status instead of index. This makes it easier to read.
    logger("info", `Template Plugin: Bot with index ${bot.index} changed status from ${Bot.EStatus[oldStatus]} to ${Bot.EStatus[newStatus]}!`);

};


/**
 * Called when a Steam Guard Code is requested for a bot account
 * @param {Bot} bot The bot object of the affected account
 * @param {function(string): void} submitCode Function to submit a code. Pass an empty string to skip the account.
 */
Plugin.prototype.steamGuardInput = function(bot, submitCode) { // eslint-disable-line

    logger("info", `Template Plugin: Bot with index ${bot.index} requested a Steam Guard Code!`, false, false, null, true); // Force log this message now with the last parameter

    // ...we could now somehow get user input (for example through a web interface if you are working on one)

    // Submit a code like this:
    // submitCode("DFMPJ");

    // ...or skip the account like this:
    // submitCode("");

    // Observe the 'statusUpdate' event to detect if the login request was already resolved from somewhere else

};


/**
 * Called when a login using a QR-Code was started
 * @param {Bot} bot The bot object of the affected account
 * @param {string} challengeUrl The QrCode Challenge URL supplied by Steam. Display this value using a QR-Code parser and let a user scan it using their Steam Mobile App.
 */
Plugin.prototype.steamGuardQrCode = function(bot, challengeUrl) { // eslint-disable-line

    logger("info", `Templage Plugin: Bot with index ${bot.index} needs their QR-Code to be scanned to log in!`, false, false, null, true); // Force log this message now with the last parameter

    // ...you could now display the QR-Code (for example in a web interface if you are working on one)

    // The qrcode (https://www.npmjs.com/package/qrcode) library can for example parse the challengeUrl into a scannable QR-Code:
    // qrcode.toString(challengeUrl, (err, string) => { ...

    // Observe the 'statusUpdate' event to detect if the login request was already resolved from somewhere else

};


/**
 * Called when DataManager is instructed to import a file from the disk or export a DataManager property to it. On data export `oldData` will always be `null`.
 * @param {string} key Which DataManager key got updated
 * @param {any} oldData Old content of the updated key
 * @param {any} newData New content of the updated key
 */
Plugin.prototype.dataUpdate = function(key, oldData, newData) { // eslint-disable-line

    logger("info", `Templage Plugin: DataManager property '${key}' got updated.`, false, false, null, true); // Force log this message now with the last parameter

};
