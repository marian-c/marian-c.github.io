'use strict';
//The module 'vscode' contains the VS Code extensibility API
//Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");

//This method is called when your extension is activated.
//Your extension is activated the very first time the command is executed.
function activate(context)
{
    //Use the console to output diagnostic information (console.log) and errors (console.error)
    //This line of code will only be executed once when your extension is activated
    //console.log('Congratulations, your extension "Retro Assembler" is now active!');
	//vscode.window.showInformationMessage("Activating extension");

    let terminalStack = [];

    //The command has been defined in the package.json file
    //Now provide the implementation of the command with registerCommand
    //The commandId parameter must match the command field in package.json

	
    //Make a Build command.
    let cmdBuild = vscode.commands.registerCommand('retroassembler.build', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the use
        let configuration = vscode.workspace.getConfiguration('retroassembler');
        let path = configuration.get('path');
        let args = configuration.get('args');
        let mainfile = configuration.get('mainfile');

        //Get the home directory of this extension under VS Code.
        //var home = require("path").join(__dirname, '..', '..'); //Back from ./out/src/ where this extension.js file is hosted.
        //Just in case we need it for an integrated RetroAssembler.exe call.
        //But I'm not sure it's worth releasing this extension with the assembler included.

		//Save the active document, if it's not saved yet.
		saveActiveDocument();
		
        //Get the path of the currently edited file.
		var filename = vscode.window.activeTextEditor.document.fileName;
		
		//Use the "mainfile" if it's set, instead of the currently edited file.
        if(mainfile.length > 0) filename = mainfile;

		//var file = filename.split('\\').pop(); //The path separator is system dependent, don't know how to get it from the system.
        var ext = filename.split('.').pop().toLowerCase(); //Getting the extension from the full filename works anyway.

		//Fix the source code file's path if it has spaces.
        if(filename.indexOf(" ") >= 0) filename = "\"" + filename + "\"";

        //Build the executable path and command line arguments for Retro Assembler using user settings.
        var cmd = path;
        if(args != "") cmd += " " + args;

        //Execute the compiler only for these file exensions...
        if(ext === "asm" || ext === "s")
        {
            //Don't create a new terminal instance every time we need to run Retro Assembler.
            //Create terminals in a stack and try to get and reuse the last existing one.

            //Check if the "terminal stack" is empty. In reality we will store max 1 entry in there.
            if(terminalStack.length === 0)
            {
                //We need to make the first terminal in the stack.
                makeTerminal();
            }

            //Get the terminal from the stack.
            var term = getLatestTerminal();

            //Execute the assembler with the currently open file's path.
            term.sendText(cmd +" "+ filename);

            //Display the terminal.
            term.show(true);
        }
    });

    //Make a BuildStart command.
    let cmdBuildStart = vscode.commands.registerCommand('retroassembler.buildstart', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the use
        let configuration = vscode.workspace.getConfiguration('retroassembler');
        let path = configuration.get('path');
        let args = configuration.get('args');
        let mainfile = configuration.get('mainfile');

        //Get the home directory of this extension under VS Code.
        //var home = require("path").join(__dirname, '..', '..'); //Back from ./out/src/ where this extension.js file is hosted.
        //Just in case we need it for an integrated RetroAssembler.exe call.
        //But I'm not sure it's worth releasing this extension with the assembler included.

		//Save the active document, if it's not saved yet.
		saveActiveDocument();

        //Get the path of the currently edited file.
		var filename = vscode.window.activeTextEditor.document.fileName;
		
		//Use the "mainfile" if it's set, instead of the currently edited file.
        if(mainfile.length > 0) filename = mainfile;

        //var file = filename.split('\\').pop(); //The path separator is system dependent, don't know how to get it from the system.
        var ext = filename.split('.').pop().toLowerCase(); //Getting the extension from the full filename works anyway.

		//Fix the source code file's path if it has spaces.
        if(filename.indexOf(" ") >= 0) filename = "\"" + filename + "\"";

        //Build the executable path and command line arguments for Retro Assembler using user settings.
        var cmd = path;
        if(args != "") cmd += " " + args;

        //Execute the compiler only for these file exensions...
        if(ext === "asm" || ext === "s")
        {
            //Don't create a new terminal instance every time we need to run Retro Assembler.
            //Create terminals in a stack and try to get and reuse the last existing one.

            //Check if the "terminal stack" is empty. In reality we will store max 1 entry in there.
            if(terminalStack.length === 0)
            {
                //We need to make the first terminal in the stack.
                makeTerminal();
            }

            //Get the terminal from the stack.
            var term = getLatestTerminal();

			//Execute the assembler with the currently open file's path.
			//On a successful build, let the assembler launch the compiled file using the LaunchCommand setting's value.
            term.sendText(cmd +" -l "+ filename);

            //Display the terminal.
            term.show(true);
        }
    });


    //Make a BuildDebug command.
    let cmdBuildDebug = vscode.commands.registerCommand('retroassembler.builddebug', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the use
        let configuration = vscode.workspace.getConfiguration('retroassembler');
        let path = configuration.get('path');
        let args = configuration.get('args');
        let mainfile = configuration.get('mainfile');

        //Get the home directory of this extension under VS Code.
        //var home = require("path").join(__dirname, '..', '..'); //Back from ./out/src/ where this extension.js file is hosted.
        //Just in case we need it for an integrated RetroAssembler.exe call.
        //But I'm not sure it's worth releasing this extension with the assembler included.

		//Save the active document, if it's not saved yet.
		saveActiveDocument();

        //Get the path of the currently edited file.
		var filename = vscode.window.activeTextEditor.document.fileName;
		
		//Use the "mainfile" if it's set, instead of the currently edited file.
        if(mainfile.length > 0) filename = mainfile;

        //var file = filename.split('\\').pop(); //The path separator is system dependent, don't know how to get it from the system.
        var ext = filename.split('.').pop().toLowerCase(); //Getting the extension from the full filename works anyway.

		//Fix the source code file's path if it has spaces.
        if(filename.indexOf(" ") >= 0) filename = "\"" + filename + "\"";

        //Build the executable path and command line arguments for Retro Assembler using user settings.
        var cmd = path;
        if(args != "") cmd += " " + args;

        //Execute the compiler only for these file exensions...
        if(ext === "asm" || ext === "s")
        {
            //Don't create a new terminal instance every time we need to run Retro Assembler.
            //Create terminals in a stack and try to get and reuse the last existing one.

            //Check if the "terminal stack" is empty. In reality we will store max 1 entry in there.
            if(terminalStack.length === 0)
            {
                //We need to make the first terminal in the stack.
                makeTerminal();
            }

            //Get the terminal from the stack.
            var term = getLatestTerminal();

			//Execute the assembler with the currently open file's path.
			//On a successful build, let the assembler launch the compiled file using the LaunchCommand setting's value.
            term.sendText(cmd +" -g "+ filename);

            //Display the terminal.
            term.show(true);
        }
	});
	

    //Creates a new terminal for code execution, with a custom title.
    function makeTerminal()
    {
        terminalStack.push(vscode.window.createTerminal(`Retro Assembler #${terminalStack.length + 1}`));
    }

    //Gets the latest used terminal instance from the stack where we may collect multiple terminal instances.
    function getLatestTerminal()
    {
        return terminalStack[terminalStack.length - 1];
    }
    
    //Event handler: Remove the closed terminal from the terminal stack.
    if('onDidCloseTerminal' in vscode.window)
    {
        vscode.window.onDidCloseTerminal((terminal) => {
            terminalStack.pop();
        });
    }
    
    //Event handler: A new terminal instance was created, increase the stack length counter.
    if('onDidOpenTerminal' in vscode.window)
    {
        vscode.window.onDidOpenTerminal((terminal) => {
            terminalStack.length + 1;
        });
	}
	
	//Register the commands created above.
	context.subscriptions.push(cmdBuild);
	context.subscriptions.push(cmdBuildStart);
	context.subscriptions.push(cmdBuildDebug);
	
	//vscode.window.showInformationMessage("Retro Assembler extension is ready.");
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate()
{
}
exports.deactivate = deactivate;

function saveActiveDocument()
{
    //Active document is not available?
	if(!vscode.window || !vscode.window.activeTextEditor || !vscode.window.activeTextEditor.document)
	{
		return;
	}

	//Save the active document.
	vscode.window.activeTextEditor.document.save().then(function (reponse){ return; });
}
