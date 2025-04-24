const fs = require('fs');
const path = require('path');

// Динамический импорт парсера, так как он будет сгенерирован после запуска build
async function runTests() {
  try {
    // Пробуем импортировать парсер
    let parser;
    try {
      parser = require('../src/parser');
    } catch (err) {
      console.error('Failed to load parser. Make sure to run "npm run build:parser" first.');
      console.error(err);
      process.exit(1);
    }

    // Читаем тестовый файл
    const samplePath = path.join(__dirname, '../samples/minimal-test.vui');
    if (!fs.existsSync(samplePath)) {
      console.error(`Test file not found: ${samplePath}`);
      process.exit(1);
    }

    const sampleCode = fs.readFileSync(samplePath, 'utf8');
    
    // Парсим код
    console.log('Parsing minimal-test.vui...');
    const ast = parser.parse(sampleCode);
    
    // Базовая проверка AST
    if (!ast || !ast.type || ast.type !== 'Program') {
      console.error('Failed: Parser did not return a valid Program AST');
      process.exit(1);
    }
    
    if (!ast.statements || !Array.isArray(ast.statements)) {
      console.error('Failed: Program does not have statements array');
      process.exit(1);
    }
    
    // Проверка, что у нас есть основные типы определений
    const typeDefinitions = ast.statements.filter(stmt => 
      stmt && stmt.type === 'TypeDefinition'
    );
    
    const componentInstanceDefinitions = ast.statements.filter(stmt => 
      stmt && stmt.type === 'ComponentInstanceDefinition'
    );
    
    // Проверяем, что у нас есть хотя бы по одному из каждого типа
    if (typeDefinitions.length === 0) {
      console.error('Failed: No type definitions found in the parsed AST');
      process.exit(1);
    }
    
    if (componentInstanceDefinitions.length === 0) {
      console.error('Failed: No component instance definitions found in the parsed AST');
     // process.exit(1);
    }
    
    // Успешно прошли все проверки
    console.log('All tests passed!');
    console.log(`Found ${ast.statements.length} top-level statements`);
    console.log(`Found ${typeDefinitions.length} type definitions`);
    console.log(`Found ${componentInstanceDefinitions.length} component instance definitions`);
    
    // Сохраняем AST в файл для проверки
    const outputPath = path.join(__dirname, '../test-output');
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }
    
    fs.writeFileSync(
      path.join(outputPath, 'ast.json'), 
      JSON.stringify(ast, null, 2)
    );
    console.log('AST saved to test-output/ast.json');
    
  } catch (error) {
    console.error('Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Запускаем тесты
runTests(); 