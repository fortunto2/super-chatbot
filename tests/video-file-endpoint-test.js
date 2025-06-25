const WebSocket = require('ws');

// Configuration
const API_BASE = 'https://api.superduperai.co';
const WS_BASE = 'wss://editor.superduperai.co';
const TOKEN = 'sk-proj-superduperai-b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8';

async function testVideoFileGeneration() {
    console.log('🎬 Testing /api/v1/file/generate-video endpoint...\n');
    
    // Test payload for video generation
    const payload = {
        config: {
            prompt: "A beautiful sunset over mountains, cinematic style",
            generation_config_name: "comfyui/ltx-video",
            duration: 5,
            width: 1024,
            height: 576,
            aspect_ratio: "16:9",
            seed: Math.floor(Math.random() * 1000000000000),
            batch_size: 1
        },
        project_id: null, // No project initially
        scene_id: null,
        entity_id: null
    };
    
    console.log('📤 Payload:', JSON.stringify(payload, null, 2));
    
    try {
        const response = await fetch(`${API_BASE}/api/v1/file/generate-video`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify(payload)
        });
        
        console.log(`📊 Response Status: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error Response:', errorText);
            return;
        }
        
        const result = await response.json();
        console.log('✅ Success Response:', JSON.stringify(result, null, 2));
        
        // Check if we got a file with project_id
        if (result.project_id) {
            console.log(`\n🔍 File created with project_id: ${result.project_id}`);
            console.log(`📁 File ID: ${result.id}`);
            
            // Now test WebSocket for this project_id
            await testWebSocketForProject(result.project_id, result.id);
        } else {
            console.log('\n⚠️ No project_id in response - WebSocket events unlikely');
        }
        
    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

async function testWebSocketForProject(projectId, fileId) {
    console.log(`\n🔌 Testing WebSocket for project: ${projectId}`);
    
    return new Promise((resolve) => {
        const ws = new WebSocket(`${WS_BASE}/ws/project/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });
        
        let eventCount = 0;
        const timeout = setTimeout(() => {
            console.log('⏰ WebSocket timeout (60s) - closing connection');
            ws.close();
            resolve();
        }, 60000);
        
        ws.on('open', () => {
            console.log('✅ WebSocket connected successfully');
        });
        
        ws.on('message', (data) => {
            eventCount++;
            try {
                const message = JSON.parse(data.toString());
                console.log(`📨 WebSocket Event #${eventCount}:`, JSON.stringify(message, null, 2));
                
                // Check if this is a completion event for our file
                if (message.type === 'file_updated' && message.data?.id === fileId) {
                    console.log('🎉 File completion event received!');
                    if (message.data.url) {
                        console.log(`🎬 Video URL: ${message.data.url}`);
                    }
                    clearTimeout(timeout);
                    ws.close();
                    resolve();
                }
            } catch (e) {
                console.log(`📨 Raw WebSocket Event #${eventCount}:`, data.toString());
            }
        });
        
        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error.message);
            clearTimeout(timeout);
            resolve();
        });
        
        ws.on('close', (code, reason) => {
            console.log(`🔌 WebSocket closed: ${code} - ${reason || 'No reason'}`);
            console.log(`📊 Total events received: ${eventCount}`);
            clearTimeout(timeout);
            resolve();
        });
    });
}

// Run the test
testVideoFileGeneration().catch(console.error); 