const vscode = require('vscode');
const parser = require('./parser');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('VUI extension is now active');

  // Register command to parse VUI file
  let parseCommand = vscode.commands.registerCommand('vui.parseFile', async function () {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor!');
        return;
      }

      const document = editor.document;
      if (document.languageId !== 'vui') {
        vscode.window.showErrorMessage('Not a VUI file!');
        return;
      }

      const text = document.getText();
      const ast = parser.parse(text);
      
      // Display AST in a new editor
      const astDocument = await vscode.workspace.openTextDocument({
        content: JSON.stringify(ast, null, 2),
        language: 'json'
      });
      
      await vscode.window.showTextDocument(astDocument, { viewColumn: vscode.ViewColumn.Beside });
      vscode.window.showInformationMessage('VUI file parsed successfully!');
    } catch (error) {
      vscode.window.showErrorMessage(`Parse error: ${error.message}`);
      console.error(error);
    }
  });

  // Register command to validate VUI file
  let validateCommand = vscode.commands.registerCommand('vui.validateFile', function () {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor!');
      return;
    }

    const document = editor.document;
    if (document.languageId !== 'vui') {
      vscode.window.showErrorMessage('Not a VUI file!');
      return;
    }

    const text = document.getText();
    try {
      parser.parse(text);
      vscode.window.showInformationMessage('VUI file is valid!');
    } catch (error) {
      const line = error.location?.start?.line || 0;
      const column = error.location?.start?.column || 0;
      const message = `${error.message} at line ${line}, column ${column}`;
      
      // Show error message with the ability to jump to the error
      vscode.window.showErrorMessage(message, 'Go to Error').then(selection => {
        if (selection === 'Go to Error') {
          const position = new vscode.Position(line - 1, column - 1);
          editor.selection = new vscode.Selection(position, position);
          editor.revealRange(
            new vscode.Range(position, position),
            vscode.TextEditorRevealType.InCenter
          );
        }
      });
    }
  });

  context.subscriptions.push(parseCommand, validateCommand);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
}; 