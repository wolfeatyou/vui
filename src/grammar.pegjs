// VUI Grammar for PEG.js

// Main program structure
Program
  = __ statements:(Comment / Statement)* __ {
      return {
        type: "Program",
        statements: statements.filter(s => s !== null)
      };
    }

// A statement can be any top-level definition
Statement
  = TypeDefinition
  / PipeDefinition
  / ActionDefinition
  / ComponentTypeDefinition
  / ComponentInstanceDefinition

// Comments start with # and span to the end of line
Comment
  = "#" [^\r\n]* EOL {
      return null; // Ignore comments in the AST
    }

// End keyword handling to stop parsing
EndKeyword
  = __ "end" ![a-zA-Z0-9_]

// Type definition
TypeDefinition
  = __ "define" __ "type" __ name:Identifier __ fields:(TypeField / Comment)* __ EndKeyword __ {
      return {
        type: "TypeDefinition",
        name: name,
        fields: fields.filter(f => f !== null)
      };
    }

TypeField
  = !EndKeyword __ name:Identifier __ typeName:TypeName __ EOL? {
      return {
        type: "TypeField",
        name: name,
        fieldType: typeName
      };
    }

TypeName
  = name:Identifier "[]" {
      return {
        typeName: name,
        isArray: true
      };
    }
  / name:Identifier {
      return {
        typeName: name,
        isArray: false
      };
    }

// Pipe definition
PipeDefinition
  = __ "define" __ "pipe" __ name:Identifier __
    params:("parameters" __ ParameterBlock)? __
    script:("script" __ ScriptBlock)? __
    EndKeyword __ {
      return {
        type: "PipeDefinition",
        name: name,
        parameters: params ? params[2] : [],
        script: script ? script[2] : null
      };
    }

ParameterBlock
  = params:(ParameterDefinition / Comment)* __ EndKeyword __ {
      return params.filter(p => p !== null);
    }

ParameterDefinition
  = __ name:Identifier __ "flow" __ typeName:TypeName __ EOL? {
      return {
        type: "ParameterDefinition",
        name: name,
        paramType: typeName
      };
    }

ScriptBlock
  = code:$((!"end" .)*)  {
      return code.trim();
    }

// Action definition
ActionDefinition
  = __ "define" __ "action" __ name:Identifier __ 
    params:("parameters" __ ParameterBlock)? __ 
    code:("script" __ ScriptBlock __ EndKeyword)? __ 
    func:FunctionBlock? __
    EndKeyword __ {
      return {
        type: "ActionDefinition",
        name: name,
        parameters: params ? params[2] : [],
        script: code ? code[2] : null,
        function: func
      };
    }

FunctionBlock
  = "function" __ name:Identifier __ "(" __ params:FunctionParam* __ ")" __ body:$((!"end" .)*) {
      return {
        name: name,
        params: params,
        body: body.trim()
      };
    }

FunctionParam
  = name:Identifier (":" type:Identifier)? __ "," __ {
      return {
        name: name,
        type: type
      };
    }
  / name:Identifier (":" type:Identifier)? {
      return {
        name: name,
        type: type
      };
    }

// Component type definition
ComponentTypeDefinition
  = __ "define" __ "component" __ "type" __ name:Identifier __ props:(ComponentProperty / Comment)* __ EndKeyword __ {
      return {
        type: "ComponentTypeDefinition",
        name: name,
        properties: props.filter(p => p !== null)
      };
    }

ComponentProperty
  = __ name:Identifier __ value:PropertyValue __ EOL? {
      return {
        type: "ComponentProperty",
        name: name,
        value: value
      };
    }
  / __ name:Identifier __ props:(ComponentProperty / Comment)* __ EndKeyword __ {
      return {
        type: "ComponentSubtype",
        name: name,
        properties: props.filter(p => p !== null)
      };
    }

PropertyValue
  = StringLiteral
  / TypeName
  / Number

// Component instance definition
ComponentInstanceDefinition
  = __ "define" __ "component" __ "instance" __ name:Identifier __ flows:(FlowDefinition / Comment)* __ ui:UIElement __ EndKeyword __ {
      return {
        type: "ComponentInstanceDefinition",
        name: name,
        flows: flows.filter(f => f !== null),
        ui: ui
      };
    }

FlowDefinition
  = __ "flow" __ typeName:TypeName __ name:Identifier __ source:FlowSource? __ EOL? {
      return {
        type: "FlowDefinition",
        flowType: typeName,
        name: name,
        source: source
      };
    }

FlowSource
  = "from" __ sourceType:("pipe" / "flow") __ source:Identifier __ args:Identifier* {
      return {
        type: "FlowSource",
        sourceType: sourceType,
        source: source,
        args: args
      };
    }

// UI Elements
UIElement
  = Container
  / Button
  / Field
  / Table

Container
  = __ "container" __ attrs:(ContainerAttribute / Comment)* __ EndKeyword __ {
      return {
        type: "Container",
        attributes: attrs.filter(a => a !== null)
      };
    }

ContainerAttribute
  = DimensionAttribute
  / ContentAttribute

DimensionAttribute
  = __ name:("width" / "height") __ value:DimensionValue __ EOL? {
      return {
        type: "DimensionAttribute",
        name: name,
        value: value
      };
    }

DimensionValue
  = Number
  / value:StringLiteral {
      return value;
    }

Number
  = value:$([0-9]+) unit:("px" / "pc") {
      return {
        type: "Dimension",
        value: parseInt(value, 10),
        unit: unit
      };
    }
  / value:$([0-9]+) {
      return {
        type: "Number",
        value: parseInt(value, 10)
      };
    }

ContentAttribute
  = __ "content" __ elements:(UIElement / Comment)* __ EndKeyword __ {
      return {
        type: "ContentAttribute",
        elements: elements.filter(e => e !== null)
      };
    }

Button
  = __ "button" __ attrs:(ElementAttribute / Comment)* __ EndKeyword __ {
      return {
        type: "Button",
        attributes: attrs.filter(a => a !== null)
      };
    }

Field
  = __ "field" (":" subtype:Identifier)? __ attrs:(ElementAttribute / Comment)* __ EndKeyword __ {
      return {
        type: "Field",
        subtype: subtype,
        attributes: attrs.filter(a => a !== null)
      };
    }

Table
  = __ "table" __ attrs:(TableAttribute / Comment)* __ EndKeyword __ {
      return {
        type: "Table",
        attributes: attrs.filter(a => a !== null)
      };
    }

TableAttribute
  = __ "flow" __ value:Identifier __ EOL? {
      return {
        type: "Attribute",
        name: "flow",
        value: value
      };
    }
  / __ "title" __ value:StringLiteral __ EOL? {
      return {
        type: "Attribute",
        name: "title",
        value: value
      };
    }
  / __ "columns" __ columns:(Column / Comment)* __ EndKeyword __ {
      return {
        type: "ColumnsAttribute",
        columns: columns.filter(c => c !== null)
      };
    }

Column
  = __ "column" (":" subtype:Identifier)? __ attrs:(ElementAttribute / Comment)* __ EndKeyword __ {
      return {
        type: "Column",
        subtype: subtype,
        attributes: attrs.filter(a => a !== null)
      };
    }

ElementAttribute
  = !EndKeyword __ name:Identifier __ value:AttributeValue __ EOL? {
      return {
        type: "Attribute",
        name: name,
        value: value
      };
    }
  / __ "action" __ actions:(ActionOperation / Comment)* __ EndKeyword __ {
      return {
        type: "ActionAttribute",
        actions: actions.filter(a => a !== null)
      };
    }

ActionOperation
  = __ name:Identifier __ params:(ActionParam / Comment)* __ EndKeyword __ {
      return {
        type: "ActionOperation",
        name: name,
        params: params.filter(p => p !== null)
      };
    }

ActionParam
  = __ name:Identifier __ value:StringLiteral __ EOL? {
      return {
        name: name,
        value: value
      };
    }
  / __ name:Identifier __ value:Identifier __ EOL? {
      return {
        name: name,
        value: value
      };
    }

AttributeValue
  = StringLiteral
  / FlowReference
  / Number
  / Identifier

FlowReference
  = "from" __ source:(
      value:StringLiteral __ "flow" __ property:("property" __ StringLiteral)? {
        return {
          type: "NamedFlowReference",
          flowName: value,
          property: property ? property[2] : null
        };
      }
    / "flow" __ property:("property" __ StringLiteral)? {
        return {
          type: "DefaultFlowReference",
          property: property ? property[2] : null
        };
      }
    / "const" __ value:StringLiteral {
        return {
          type: "ConstReference",
          value: value
        };
      }
    ) {
      return {
        type: "FlowReference",
        source: source
      };
    }

// Basic tokens
Identifier
  = name:$([a-zA-Z_][a-zA-Z0-9_]*) {
      return name;
    }

StringLiteral
  = '"' value:$([^"]*) '"' {
      return value;
    }

// Whitespace handling
__
  = (Whitespace / EOL / Comment)*

Whitespace
  = [ \t\v\f]

EOL
  = "\n"
  / "\r\n"
  / "\r"
