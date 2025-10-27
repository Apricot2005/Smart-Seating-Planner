// --- 8. Gen AI Function (VERSION FOR CHATGPT) ---

async function getAiSummary(plan, apiKey) {
    const aiSummaryBox = document.getElementById("ai-summary");
    const statusMsg = document.getElementById("status-message");

    // 1. This is the OpenAI API endpoint
    const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    const planText = plan.map(s => `Student ${s.id} (${s.subject}) is at Row ${s.row}, Seat ${s.seat}.`).join("\n");

    const prompt = `
        You are an exam administrator. 
        Based on this seating plan data:
        ${planText}

        Write a short, friendly summary (in markdown) for the exam proctor. 
        Point out any key patterns (e.g., "Note that all Math students are well-separated").
    `;

    try {
        const response = await fetch(OPENAI_API_URL, {
            method: "POST",
            // 2. The headers are different. The key is a "Bearer" token.
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}` // Note: "Bearer" is required
            },
            // 3. The body is different. It uses a "messages" array.
            body: JSON.stringify({
                "model": "gpt-3.5-turbo", // This is the fast, cheap model
                "messages": [
                    { "role": "user", "content": prompt }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            // This will give you a specific error message from OpenAI
            throw new Error(`API Error: ${error.error.message}`); 
        }

        const data = await response.json();

        // 4. The path to the text in the response is different.
        const summary = data.choices[0].message.content; 

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
        aiSummaryBox.innerHTML = `<h3 class="text-xl font-semibold mb-3 text-red-700">🤖 Gen AI Error</h3><p>${error.message}</p>`;
        aiSummaryBox.style.display = "block";
    }
}