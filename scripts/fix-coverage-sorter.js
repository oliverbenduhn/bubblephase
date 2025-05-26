#!/usr/bin/env node

/**
 * Post-processing script to fix null-checking issues in generated coverage sorter.js
 * Run this after generating coverage reports to make the sorter more robust.
 */

const fs = require('fs');
const path = require('path');

const coverageSorterPath = path.join(__dirname, '../coverage/lcov-report/sorter.js');

if (!fs.existsSync(coverageSorterPath)) {
    console.log('Coverage sorter.js not found - skipping fix');
    process.exit(0);
}

console.log('Fixing null-checking issues in coverage sorter.js...');

let content = fs.readFileSync(coverageSorterPath, 'utf8');

// Fix getTableHeader function
content = content.replace(
    /function getTableHeader\(\) {\s*return getTable\(\)\.querySelector\('thead tr'\);\s*}/,
    `function getTableHeader() {
        const table = getTable();
        return table ? table.querySelector('thead tr') : null;
    }`
);

// Fix getTableBody function  
content = content.replace(
    /function getTableBody\(\) {\s*return getTable\(\)\.querySelector\('tbody'\);\s*}/,
    `function getTableBody() {
        const table = getTable();
        return table ? table.querySelector('tbody') : null;
    }`
);

// Fix getNthColumn function
content = content.replace(
    /function getNthColumn\(n\) {\s*return getTableHeader\(\)\.querySelectorAll\('th'\)\[n\];\s*}/,
    `function getNthColumn(n) {
        const header = getTableHeader();
        return header ? header.querySelectorAll('th')[n] : null;
    }`
);

// Fix loadColumns function - add null check at the beginning
content = content.replace(
    /function loadColumns\(\) {\s*var colNodes = getTableHeader\(\)\.querySelectorAll\('th'\),/,
    `function loadColumns() {
        const header = getTableHeader();
        if (!header) return [];
        var colNodes = header.querySelectorAll('th'),`
);

// Fix loadData function - add null check at the beginning
content = content.replace(
    /function loadData\(\) {\s*var rows = getTableBody\(\)\.querySelectorAll\('tr'\),/,
    `function loadData() {
        const body = getTableBody();
        if (!body) return;
        var rows = body.querySelectorAll('tr'),`
);

fs.writeFileSync(coverageSorterPath, content);
console.log('✅ Coverage sorter.js null-checking issues fixed');
