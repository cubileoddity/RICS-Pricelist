// assets/js/rics-store.js
class RICSStore {
    constructor() {
        this.data = {
            items: [],
            events: [],
            traits: [],
            races: []
        };
        this.filteredData = {
            items: [],
            events: [],
            traits: [],
            races: []
        };
        this.currentSort = {};
        this.init();
    }

    async init() {
        await this.loadAllData();
        this.renderAllTabs();
        this.setupEventListeners();
    }

    async loadAllData() {
        try {
            // Load items
            const itemsResponse = await fetch('data/StoreItems.json');
            const itemsData = await itemsResponse.json();
            
            if (itemsData.items) {
                this.data.items = this.processItemsData(itemsData.items);
            } else {
                this.data.items = this.processItemsData(itemsData);
            }
            this.filteredData.items = [...this.data.items];
    
            // Load traits
            const traitsResponse = await fetch('data/Traits.json');
            const traitsData = await traitsResponse.json();
            this.data.traits = this.processTraitsData(traitsData);
            this.filteredData.traits = [...this.data.traits];
    
            // Load other data types as needed
            // const eventsResponse = await fetch('data/StoreEvents.json');
            // const eventsData = await eventsResponse.json();
            // this.data.events = this.processEventsData(eventsData);
            // this.filteredData.events = [...this.data.events];
    
            console.log('Data loaded:', {
                items: this.data.items.length,
                traits: this.data.traits.length,
                events: this.data.events.length,
                races: this.data.races.length
            });
    
        } catch (error) {
            console.error('Error loading data:', error);
            this.loadSampleData();
        }
    }

    processItemsData(itemsObject) {
        return Object.entries(itemsObject)
            .map(([key, itemData]) => {
                // Use the structure from your sample
                return {
                    defName: itemData.DefName || key,
                    name: itemData.CustomName || itemData.DefName || key,
                    price: itemData.BasePrice || 0,
                    category: itemData.Category || 'Misc',
                    quantityLimit: itemData.HasQuantityLimit ? (itemData.QuantityLimit || 0) : 'Unlimited',
                    limitMode: itemData.LimitMode,
                    mod: itemData.Mod || 'Unknown',
                    isUsable: itemData.IsUsable || false,
                    isEquippable: itemData.IsEquippable || false,
                    isWearable: itemData.IsWearable || false,
                    enabled: itemData.Enabled !== false
                };
            })
            .filter(item => {
                // Only include if enabled AND at least one usage type is true
                return (item.enabled || item.isUsable || item.isEquippable || item.isWearable);
            })
            .filter(item => item.price > 0); // Only items with price > 0
    }

    processEventsData(data) {
        // Adjust this based on your actual Events JSON structure
        return Object.entries(data)
            .map(([defname, eventData]) => ({
                defname,
                name: eventData.CustomName || defname,
                price: eventData.BasePrice || 0,
                karmaType: eventData.KarmaType || 'None',
                enabled: eventData.Enabled !== false
            }))
            .filter(event => event.enabled && event.price > 0);
    }

    processTraitsData(traitsObject) {
        return Object.entries(traitsObject)
            .map(([key, traitData]) => {
                return {
                    defName: traitData.DefName || key,
                    name: traitData.Name || traitData.DefName || key,
                    description: this.processTraitDescription(traitData.Description || ''),
                    stats: traitData.Stats || [],
                    conflicts: traitData.Conflicts || [],
                    canAdd: traitData.CanAdd || false,
                    canRemove: traitData.CanRemove || false,
                    addPrice: traitData.AddPrice || 0,
                    removePrice: traitData.RemovePrice || 0,
                    bypassLimit: traitData.BypassLimit || false,
                    modSource: traitData.ModSource || 'Unknown'
                };
            })
            .filter(trait => {
                // Only include if at least one operation is allowed
                return trait.canAdd || trait.canRemove;
            })
            .filter(trait => trait.addPrice > 0 || trait.removePrice > 0); // Only traits with prices
    }

    processTraitDescription(description) {
        // Replace all common pawn placeholders with traditional names
        // Handle both {} and [] formats with separate replacements
        return description
            // Replace {PAWN_*} formats
            .replace(/{PAWN_nameDef}/g, 'Timmy')
            .replace(/{PAWN_name}/g, 'Timmy')
            .replace(/{PAWN_pronoun}/g, 'he')
            .replace(/{PAWN_possessive}/g, 'his')
            .replace(/{PAWN_objective}/g, 'him')
            .replace(/{PAWN_label}/g, 'Timmy')
            .replace(/{PAWN_def}/g, 'Timmy')
            // Replace [PAWN_*] formats  
            .replace(/\[PAWN_nameDef\]/g, 'Timmy')
            .replace(/\[PAWN_name\]/g, 'Timmy')
            .replace(/\[PAWN_pronoun\]/g, 'he')
            .replace(/\[PAWN_possessive\]/g, 'his')
            .replace(/\[PAWN_objective\]/g, 'him')
            .replace(/\[PAWN_label\]/g, 'Timmy')
            .replace(/\[PAWN_def\]/g, 'Timmy');
    }

    processRacesData(data) {
        // Adjust this based on your actual Races JSON structure
        return Object.entries(data)
            .map(([defname, raceData]) => ({
                defname,
                name: raceData.CustomName || defname,
                price: raceData.BasePrice || 0,
                karmaType: raceData.KarmaType || 'None',
                enabled: raceData.Enabled !== false
            }))
            .filter(race => race.enabled && race.price > 0);
    }

    renderAllTabs() {
        this.renderItems();
        this.renderEvents();
        this.renderTraits();
        this.renderRaces();
    }

    renderItems() {
        const tbody = document.getElementById('items-tbody');
        const items = this.filteredData.items;
    
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">No items found</td></tr>';
            return;
        }
    
        tbody.innerHTML = items.map(item => `
            <tr>
                <td>
                    <div class="item-name">${this.escapeHtml(item.name)}</div>
                    <span class="metadata">
                        ${this.escapeHtml(item.defName)}
                        <br>From ${this.escapeHtml(item.mod)}
                        ${this.getUsageTypes(item)}
                    </span>
                </td>
                <td class="no-wrap">
                    <strong>${item.price}</strong>
                    <span class="mobile-priority primary"></span>
                </td>
                <td>${this.escapeHtml(item.category)}</td>
                <td class="no-wrap">${item.quantityLimit}</td>
                <td>${item.limitMode || 'N/A'}</td>
            </tr>
        `).join('');
    }
    
    getUsageTypes(item) {
        const types = [];
        if (item.isUsable) types.push('Usable');
        if (item.isEquippable) types.push('Equippable');
        if (item.isWearable) types.push('Wearable');
        
        return types.length > 0 ? `<br><span class="usage">Usage: ${types.join(', ')}</span>` : '';
    }

    renderEvents() {
        const tbody = document.getElementById('events-tbody');
        const events = this.filteredData.events;

        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 40px;">No events found</td></tr>';
            return;
        }

        tbody.innerHTML = events.map(event => `
            <tr>
                <td>${this.escapeHtml(event.name)}</td>
                <td>${event.price}</td>
                <td>${this.escapeHtml(event.karmaType)}</td>
            </tr>
        `).join('');
    }

    renderTraits() {
        const tbody = document.getElementById('traits-tbody');
        const traits = this.filteredData.traits;
    
        if (traits.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px;">No traits found</td></tr>';
            return;
        }
    
        tbody.innerHTML = traits.map(trait => `
            <tr>
                <td>
                    <div class="item-name">${this.escapeHtml(trait.name)}</div>
                    <span class="metadata">
                        ${this.escapeHtml(trait.defName)}
                        <br>From ${this.escapeHtml(trait.modSource)}
                        ${trait.bypassLimit ? '<br><span class="usage">Bypasses Limit</span>' : ''}
                    </span>
                </td>
                <td class="no-wrap">
                    ${trait.canAdd ? `<strong>${trait.addPrice}</strong>` : '<span class="metadata">Cannot Add</span>'}
                </td>
                <td class="no-wrap">
                    ${trait.canRemove ? `<strong>${trait.removePrice}</strong>` : '<span class="metadata">Cannot Remove</span>'}
                </td>
                <td>
                    <div class="trait-description">${this.escapeHtml(trait.description)}</div>
                    ${this.renderTraitStats(trait)}
                    ${this.renderTraitConflicts(trait)}
                </td>
            </tr>
        `).join('');
    }
    
    renderTraitStats(trait) {
        if (!trait.stats || trait.stats.length === 0) return '';
        
        return `
            <div class="metadata">
                <strong>Stats:</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    ${trait.stats.map(stat => `<li>${this.escapeHtml(stat)}</li>`).join('')}
                </ul>
            </div>
        `;
    }

renderTraitConflicts(trait) {
    if (!trait.conflicts || trait.conflicts.length === 0) return '';
    
    return `
        <div class="metadata">
            <strong>Conflicts with:</strong>
            <ul style="margin: 5px 0; padding-left: 20px;">
                ${trait.conflicts.map(conflict => `<li>${this.escapeHtml(conflict)}</li>`).join('')}
            </ul>
        </div>
    `;
}

    renderRaces() {
        const tbody = document.getElementById('races-tbody');
        const races = this.filteredData.races;

        if (races.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 40px;">No races found</td></tr>';
            return;
        }

        tbody.innerHTML = races.map(race => `
            <tr>
                <td>${this.escapeHtml(race.name)}</td>
                <td>
                    ${race.price}
                    ${race.karmaType ? `<span class="metadata">Karma: ${this.escapeHtml(race.karmaType)}</span>` : ''}
                </td>
                <td>${this.escapeHtml(race.karmaType)}</td>
            </tr>
        `).join('');
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });

        // Search functionality for each tab
        this.setupSearch('items');
        this.setupSearch('events');
        this.setupSearch('traits');
        this.setupSearch('races');

        // Sort functionality
        this.setupSorting();
    }

    setupSearch(tabName) {
        const searchInput = document.getElementById(`${tabName}-search`);
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterTab(tabName, e.target.value);
            });
        }
    }

    filterTab(tabName, searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const allData = this.data[tabName];

        if (term === '') {
            this.filteredData[tabName] = [...allData];
        } else {
            this.filteredData[tabName] = allData.filter(item =>
                Object.values(item).some(value =>
                    value && value.toString().toLowerCase().includes(term)
                )
            );
        }

        this[`render${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`]();
    }

    setupSorting() {
        // Add sorting to all sortable headers
        document.querySelectorAll('th[data-sort]').forEach(header => {
            header.addEventListener('click', () => {
                const tab = header.closest('.tab-pane').id;
                this.sortTab(tab, header.dataset.sort);
            });
        });
    }

    sortTab(tabName, field) {
        if (!this.currentSort[tabName]) {
            this.currentSort[tabName] = { field, direction: 'asc' };
        } else if (this.currentSort[tabName].field === field) {
            this.currentSort[tabName].direction = this.currentSort[tabName].direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort[tabName] = { field, direction: 'asc' };
        }

        this.filteredData[tabName].sort((a, b) => {
            let aValue = a[field];
            let bValue = b[field];

            // Handle "Unlimited" quantity limit for sorting
            if (field === 'quantityLimit') {
                aValue = aValue === 'Unlimited' ? Infinity : aValue;
                bValue = bValue === 'Unlimited' ? Infinity : bValue;
            }

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return this.currentSort[tabName].direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.currentSort[tabName].direction === 'asc' ? 1 : -1;
            return 0;
        });

        this[`render${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`]();
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    loadSampleData() {
        // Fallback sample data
        console.log('Loading sample data...');
        this.data.items = [
            {
                defName: "TextBook",
                name: "Textbook",
                price: 267,
                category: "Books",
                quantityLimit: 5,
                limitMode: "OneStack",
                mod: "Core",
                isUsable: false,
                isEquippable: false,
                isWearable: false,
                enabled: true
            },
            {
                defName: "Schematic",
                name: "Schematic", 
                price: 250,
                category: "Books",
                quantityLimit: 5,
                limitMode: "OneStack",
                mod: "Core",
                isUsable: false,
                isEquippable: false,
                isWearable: false,
                enabled: true
            }
        ];
        this.filteredData.items = [...this.data.items];
        this.renderItems();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new RICSStore();
});
