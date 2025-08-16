const fs = require('fs');
const path = require('path');

// Функция для генерации случайных цифр
function generateRandomDigits(count) {
    let result = '';
    for (let i = 0; i < count; i++) {
        result += Math.floor(Math.random() * 10);
    }
    return result;
}

// Создание папки build если её нет
const buildDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
    console.log('✅ Папка build создана');
}

// Генерация 5 случайных цифр
const randomDigits = generateRandomDigits(5);

// Создание файла index.txt
const indexPath = path.join(buildDir, 'index.txt');
fs.writeFileSync(indexPath, randomDigits, 'utf8');

console.log(`✅ Файл index.txt создан в папке build с содержимым: ${randomDigits}`);
console.log(`📁 Путь: ${indexPath}`);
