// --- 8. Gen AI Function (FOR GEMINI) ---

async function getAiSummary(plan, apiKey) {
    const aiSummaryBox = document.getElementById("ai-summary");
    const statusMsg = document.getElementById("status-message");
    
    // 1. This is the correct Gemini URL
    const GEMINI_API_URL = `https://generativemodels.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const planText = plan.map(s => `Student ${s.id} (${s.subject}) is at Row ${s.row}, Seat ${s.seat}.`).join("\n");
    
    const prompt = `
        You are an exam administrator. 
        Based on this seating plan data:
        ${planText}
        
        Write a short, friendly summary (in markdown) for the exam proctor. 
        Point out any key patterns (e.g., "Note that all Math students are well-separated").
    `;
    
    try {
        const response = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            // This will give us a more specific error from Google
            const error = await response.json(); 
            throw new Error(`API Error: ${error.error.message}`);
        }

        const data = await response.json();
        
        // 2. This is the correct path to the text
        const summary = data.candidates[0].content.parts[0].text; 
        
        let htmlSummary = summary
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^\* (.*$)/gm, '<ul class="list-disc list-inside"><li>$1</li></ul>')
            .replace(/\n/g, "<br>");

        aiSummaryBox.innerHTML = `<h3 class="text-xl font-semibold mb-3 text-indigo-700">🤖 Gen AI Summary</h3><div class="space-y-2 text-gray-700">${htmlSummary}</div>`;
        aiSummaryBox.style.display = "block";
        statusMsg.textContent = `🎉 Success! Plan generated and summary complete.`;

    } catch (error) {
        console.error("Gen AI Error:", error);
        // This will now show the *specific* error message
        aiSummaryBox.innerHTML = `<h3 class="text-xl font-semibold mb-3 text-red-700">🤖 Gen AI Error</h3><p>${error.message}</p>`;
        aiSummaryBox.style.display = "block";
    }
}
