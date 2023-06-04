/*
 * File: plugin.js
 * Project: steam-comment-service-bot
 * Created Date: 25.02.2022 09:37:57
 * Author: 3urobeat
 *
 * Last Modified: 04.06.2023 17:32:56
 * Modified By: 3urobeat
 */


let logger = require("output-logger");

const PluginSystem  = require("../../src/pluginSystem/pluginSystem.js"); // eslint-disable-line
const pluginPackage = require("./package.json"); // eslint-disable-line
const pluginConfig  = require("./config.json"); // eslint-disable-line


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
Plugin.prototype.load = function() {
    logger("info", "Hello World!"); // Log something for example. This will be logged instantly but only appear after ready because of the readyafterlogs system.

    // Example of adding a command that will respond with "Hello World!" on "hello" or "cool-alias"
    this.commandHandler.registerCommand({
        names: ["hello", "cool-alias"],
        description: "Responds with Hello World!",
        ownersOnly: false,

        run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
            respondModule(context, resInfo, "Hello world!");
        }
    });
};



/**
 * This function will be called when the bot is ready (aka all accounts were logged in).
 */
Plugin.prototype.ready = function() {

    logger("info", "I am the plugin and we seem to be ready!");

    // Example of pretending the first owner used the '!ping' command
    let firstOwnerSteamID = this.data.cachefile.ownerid[0]; // Get first ownerid from cache to make sure it was converted to a steamID64

    this.commandHandler.runCommand("ping", [], firstOwnerSteamID, this.controller.main.sendChatMessage, this.controller.main, { steamID64: firstOwnerSteamID });
    // Note: This does seem to throw a RateLimitExceeded error which even a large delay doesn't fix. The retry works however. Idk, I think Steam might be at fault. // TODO: or is this a context related problem?

};


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
 * @param {function(string)} submitCode Function to submit a code. Pass an empty string to skip the account.
 */
Plugin.prototype.steamGuardInput = function(bot, submitCode) { // eslint-disable-line

    logger("info", `Template Plugin: Bot with index ${bot.index} requested a Steam Guard Code!`, false, false, null, true); // Force log this message now with the last parameter

    // ...we could now somehow get user input (for example through a web interface if you are working on one)

    // Submit a code like this:
    // submitCode("DFMPJ");

    // ...or skip the account like this:
    // submitCode("");

};