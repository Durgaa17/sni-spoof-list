class HomePage {
    constructor() {
        this.toolsGrid = document.getElementById('toolsGrid');
        this.contentArea = document.getElementById('contentArea');
        this.tools = [
            {
                id: 'vless-stripper',
                title: 'VLESS Stripper',
                icon: '⚡',
                description: 'Strip VLESS configurations to basic parameters',
                module: './tools/stripper.js'
            }
            // Add more tools here later...
        ];
        
        this.init();
    }

    init() {
        this.loadToolsGrid();
        this.showWelcome();
    }

    loadToolsGrid() {
        this.toolsGrid.innerHTML = this.tools.map(tool => `
            <div class="tool-card" data-tool="${tool.id}">
                <div class="tool-icon">${tool.icon}</div>
                <div class="tool-title">${tool.title}</div>
                <div class="tool-desc">${tool.description}</div>
            </div>
        `).join('');

        // Add event listeners to tool cards
        this.toolsGrid.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const toolId = e.currentTarget.getAttribute('data-tool');
                this.loadTool(toolId);
            });
        });
    }

    showWelcome() {
        this.contentArea.innerHTML = `
            <div style="text-align: center; padding: 40px 0;">
                <h2>Welcome to SNI Tools Hub</h2>
                <p style="color: #888; margin-top: 10px;">
                    Select a tool from the grid above to get started
                </p>
            </div>
        `;
    }

    async loadTool(toolId) {
        const tool = this.tools.find(t => t.id === toolId);
        if (!tool) return;

        try {
            // Hide tools grid and show loading
            this.toolsGrid.style.display = 'none';
            this.contentArea.innerHTML = `
                <div style="text-align: center; padding: 40px 0;">
                    <div style="font-size: 2rem; margin-bottom: 20px;">⏳</div>
                    <p>Loading ${tool.title}...</p>
                </div>
            `;

            // Load the tool module
            const module = await import(tool.module);
            
            // Clear content
            this.contentArea.innerHTML = '';
            
            // Add back button
            const backBtn = document.createElement('button');
            backBtn.className = 'back-btn';
            backBtn.innerHTML = '← Back to Home';
            backBtn.onclick = () => this.showHome();
            this.contentArea.appendChild(backBtn);

            // Initialize the tool
            if (module.default) {
                module.default(this.contentArea);
            } else {
                throw new Error('Tool module format is invalid');
            }

        } catch (error) {
            console.error('Failed to load tool:', error);
            this.contentArea.innerHTML = `
                <div style="text-align: center; padding: 40px 0; color: #ff6b6b;">
                    <h3>Failed to load tool</h3>
                    <p>${error.message}</p>
                    <p style="font-size: 0.9rem; color: #888; margin-top: 10px;">
                        File: ${tool.module}
                    </p>
                    <button class="back-btn" onclick="homePage.showHome()">Back to Home</button>
                </div>
            `;
        }
    }

    showHome() {
        this.toolsGrid.style.display = 'grid';
        this.showWelcome();
    }
}

// Initialize homepage when DOM is loaded
let homePage;
document.addEventListener('DOMContentLoaded', () => {
    homePage = new HomePage();
});
