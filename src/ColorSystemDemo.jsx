// Test component to demonstrate the color system working correctly
import React, { useState } from 'react';
import { BUBBLE_COLOR_IDS, COLOR_THEMES, getColorValue, switchToTheme } from './config';

const ColorSystemDemo = () => {
    const [currentTheme, setCurrentTheme] = useState(0);
    const [bubbles] = useState([
        { id: 1, colorId: BUBBLE_COLOR_IDS.A, name: 'A (Rot/Rosa/Koralle)' },
        { id: 2, colorId: BUBBLE_COLOR_IDS.B, name: 'B (Grün)' },
        { id: 3, colorId: BUBBLE_COLOR_IDS.C, name: 'C (Blau)' },
        { id: 4, colorId: BUBBLE_COLOR_IDS.D, name: 'D (Gelb)' },
        { id: 5, colorId: BUBBLE_COLOR_IDS.E, name: 'E (Lila)' }
    ]);
    
    const themeNames = Object.keys(COLOR_THEMES);
    
    const handleThemeSwitch = (themeIndex) => {
        switchToTheme(themeIndex);
        setCurrentTheme(themeIndex);
    };
    
    const getColorHex = (colorId) => {
        const color = getColorValue(colorId);
        return `#${color.toString(16).padStart(6, '0')}`;
    };
    
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h2>🎨 Color System Demo</h2>
            <p>This demonstrates that bubbles maintain their logical color identities across theme changes.</p>
            
            <div style={{ marginBottom: '20px' }}>
                <h3>Current Theme: {themeNames[currentTheme]}</h3>
                {themeNames.map((themeName, index) => (
                    <button 
                        key={index}
                        onClick={() => handleThemeSwitch(index)}
                        style={{
                            margin: '5px',
                            padding: '8px 16px',
                            backgroundColor: index === currentTheme ? '#007bff' : '#f8f9fa',
                            color: index === currentTheme ? 'white' : 'black',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        {themeName}
                    </button>
                ))}
            </div>
            
            <div>
                <h3>Bubble Colors (Logical IDs preserved across themes):</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {bubbles.map(bubble => (
                        <div 
                            key={bubble.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                backgroundColor: '#f9f9f9'
                            }}
                        >
                            <div 
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    backgroundColor: getColorHex(bubble.colorId),
                                    marginRight: '10px',
                                    border: '2px solid #333'
                                }}
                            />
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{bubble.name}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    ID: {bubble.colorId}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    Color: {getColorHex(bubble.colorId)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '5px' }}>
                <strong>✅ Success Indicators:</strong>
                <ul style={{ margin: '5px 0' }}>
                    <li>Each bubble shows a different color for each theme</li>
                    <li>Color IDs remain the same (COLOR_A, COLOR_B, etc.)</li>
                    <li>When you switch themes, all colors change but maintain their relationships</li>
                    <li>This simulates what happens in the game when bubbles keep their logical identities</li>
                </ul>
            </div>
        </div>
    );
};

export default ColorSystemDemo;
