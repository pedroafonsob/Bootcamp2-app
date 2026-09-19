// Base de dados simulada B3
const DB_B3 = [
    { ticker: 'TAEE11', name: 'Taesa S.A.', type: 'Energia', price: 35.40, dy: 9.8, lastDiv: 1.15, pvp: 1.05, color: '#3b82f6', nextDiv: '15/Out' },
    { ticker: 'BBAS3', name: 'Banco do Brasil', type: 'Ação Bancária', price: 27.80, dy: 11.2, lastDiv: 0.95, pvp: 0.88, color: '#eab308', nextDiv: '28/Set' },
    { ticker: 'ITUB4', name: 'Itaú Unibanco', type: 'Ação Bancária', price: 33.15, dy: 6.5, lastDiv: 0.25, pvp: 1.45, color: '#f97316', nextDiv: '02/Out' },
    { ticker: 'WEGE3', name: 'WEG S.A.', type: 'Indústria', price: 38.50, dy: 2.1, lastDiv: 0.08, pvp: 6.20, color: '#0ea5e9', nextDiv: 'N/A' },
    { ticker: 'VALE3', name: 'Vale S.A.', type: 'Mineração', price: 62.40, dy: 8.4, lastDiv: 2.73, pvp: 1.15, color: '#14b8a6', nextDiv: '12/Dez' },
    { ticker: 'MXRF11', name: 'Maxi Renda FII', type: 'FII - Papel', price: 10.45, dy: 12.5, lastDiv: 0.11, pvp: 1.01, color: '#10b981', nextDiv: '14/Out' },
    { ticker: 'HGLG11', name: 'CSHG Logística', type: 'FII - Tijolo', price: 162.30, dy: 8.9, lastDiv: 1.10, pvp: 1.06, color: '#6366f1', nextDiv: '12/Out' },
    { ticker: 'KNCR11', name: 'Kinea Rendimentos', type: 'FII - Papel', price: 103.50, dy: 13.1, lastDiv: 1.25, pvp: 1.02, color: '#8b5cf6', nextDiv: '10/Out' },
    { ticker: 'BTLG11', name: 'BTG Logística', type: 'FII - Tijolo', price: 101.80, dy: 9.2, lastDiv: 0.76, pvp: 1.04, color: '#ec4899', nextDiv: '15/Out' },
    { ticker: 'VISC11', name: 'Vinci Shoppings', type: 'FII - Tijolo', price: 118.20, dy: 8.5, lastDiv: 1.00, pvp: 0.98, color: '#f43f5e', nextDiv: '14/Out' }
];

// Estado da Aplicação
let wallet = JSON.parse(localStorage.getItem('investProWallet')) || [];
let currentModalAsset = null;
let allocationChartInstance = null;

// Utilitário de Formatação de Moeda
const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

// Notificações em Toast
const showToast = (msg, type = 'success') => {
    const toast = document.createElement('div');
    const icon = type === 'success' ? 'ph-check-circle text-emerald-400' : 'ph-warning-circle text-red-400';
    toast.className = `fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 font-medium toast-enter border border-slate-700`;
    toast.innerHTML = `<i class="ph-fill ${icon} text-2xl"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('toast-active'), 10);
    setTimeout(() => { 
        toast.classList.remove('toast-active'); 
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
};

// Navegação de Abas
const switchTab = (tabName) => {
    document.querySelectorAll('main > div > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`aba-${tabName}`).classList.remove('hidden');
    
    document.querySelectorAll('aside nav button').forEach(b => {
        b.classList.remove('bg-indigo-50', 'text-indigo-700');
        b.classList.add('text-slate-600');
    });
    
    const btn = document.getElementById(`btn-tab-${tabName}`);
    if(btn) {
        btn.classList.add('bg-indigo-50', 'text-indigo-700');
        btn.classList.remove('text-slate-600');
    }

    if(tabName === 'carteira') updateWalletView();
    if(tabName === 'api') fetchGlobalRates();
};

// Renderização dos Ativos no Grid
const renderAssets = (data) => {
    const grid = document.getElementById('assets-grid');
    grid.innerHTML = '';
    
    data.forEach(asset => {
        const card = document.createElement('div');
        card.className = 'bg-white p-6 rounded-2xl card-hover cursor-pointer relative overflow-hidden group';
        card.onclick = () => openModal(asset);
        
        card.innerHTML = `
            <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-100 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <div class="flex justify-between items-start mb-5">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm" style="background-color: ${asset.color}">
                    ${asset.ticker.substring(0, 2)}
                </div>
                <span class="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">${asset.type}</span>
            </div>
            <h3 class="font-black text-slate-900 text-xl">${asset.ticker}</h3>
            <p class="text-slate-500 text-sm mb-4 truncate font-medium">${asset.name}</p>
            <div class="flex justify-between items-end mt-auto pt-4 border-t border-slate-100">
                <div class="text-2xl font-black text-slate-900">${formatMoney(asset.price)}</div>
                <div class="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-sm font-bold flex items-center gap-1">
                    <i class="ph-bold ph-trend-up"></i> DY ${asset.dy}%
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
};

// Filtro de Ativos
const filterAssets = (type) => {
    document.querySelectorAll('.filter-btn').forEach(b => {
        if(b.innerText.includes(type) || (type === 'Todos' && b.innerText === 'Todos os Ativos')){
            b.classList.replace('bg-white', 'bg-slate-900');
            b.classList.replace('text-slate-700', 'text-white');
        } else {
            b.classList.replace('bg-slate-900', 'bg-white');
            b.classList.replace('text-white', 'text-slate-700');
        }
    });

    if(type === 'Todos') renderAssets(DB_B3);
    else renderAssets(DB_B3.filter(a => a.type === type));
};

// Busca
document.getElementById('search-input').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    renderAssets(DB_B3.filter(a => a.ticker.toLowerCase().includes(term) || a.name.toLowerCase().includes(term)));
});

// Modal de Detalhes do Ativo
const openModal = (asset) => {
    currentModalAsset = asset;
    document.getElementById('asset-modal').classList.remove('hidden');
    document.getElementById('buy-form').classList.add('hidden');
    
    const modalIcon = document.getElementById('modal-icon');
    modalIcon.style.backgroundColor = asset.color;
    modalIcon.innerText = asset.ticker.substring(0, 2);

    document.getElementById('modal-ticker').innerText = asset.ticker;
    document.getElementById('modal-name').innerText = asset.name;
    document.getElementById('modal-type-badge').innerText = asset.type;
    document.getElementById('modal-price').innerText = formatMoney(asset.price);
    document.getElementById('modal-dy').innerText = `${asset.dy.toFixed(1)}%`;
    document.getElementById('modal-last-div').innerText = formatMoney(asset.lastDiv);
    document.getElementById('modal-pvp').innerText = asset.pvp.toFixed(2);
    
    const pvpStatus = document.getElementById('modal-pvp-status');
    if (asset.pvp < 0.98) {
        pvpStatus.innerText = 'Com Desconto';
        pvpStatus.className = 'text-xs mt-1 font-bold text-emerald-600';
    } else if (asset.pvp <= 1.05) {
        pvpStatus.innerText = 'Preço Justo';
        pvpStatus.className = 'text-xs mt-1 font-bold text-slate-500';
    } else {
        pvpStatus.innerText = 'Acima do VPA';
        pvpStatus.className = 'text-xs mt-1 font-bold text-amber-600';
    }

    // Calculadora Bola de Neve
    const snowballCount = asset.lastDiv > 0 ? Math.ceil(asset.price / asset.lastDiv) : 0;
    document.getElementById('modal-snowball').innerText = snowballCount;

    // Simulação de Retorno
    const simReturn = 1000 * (1 + (asset.dy / 100));
    document.getElementById('modal-sim-value').innerText = formatMoney(simReturn);
    document.getElementById('buy-price').value = asset.price;
};

const closeModal = () => {
    document.getElementById('asset-modal').classList.add('hidden');
};

const openBuyForm = () => {
    document.getElementById('buy-form').classList.remove('hidden');
};

const closeBuyForm = () => {
    document.getElementById('buy-form').classList.add('hidden');
};

const confirmBuy = () => {
    const qtd = parseInt(document.getElementById('buy-qtd').value);
    const price = parseFloat(document.getElementById('buy-price').value);

    if (!qtd || qtd <= 0 || !price || price <= 0) {
        showToast('Preencha a quantidade e o preço corretamente.', 'error');
        return;
    }

    const existingIndex = wallet.findIndex(item => item.ticker === currentModalAsset.ticker);

    if (existingIndex >= 0) {
        const item = wallet[existingIndex];
        const newTotalQtd = item.qtd + qtd;
        const newAvgPrice = ((item.qtd * item.avgPrice) + (qtd * price)) / newTotalQtd;
        wallet[existingIndex] = { ...item, qtd: newTotalQtd, avgPrice: newAvgPrice };
    } else {
        wallet.push({
            ticker: currentModalAsset.ticker,
            qtd: qtd,
            avgPrice: price
        });
    }

    localStorage.setItem('investProWallet', JSON.stringify(wallet));
    showToast(`Compra de ${qtd} x ${currentModalAsset.ticker} salva com sucesso!`);
    closeBuyForm();
    closeModal();
    updateWalletView();
};

// Gerenciamento da Carteira
const updateWalletView = () => {
    const tbody = document.getElementById('wallet-table-body');
    tbody.innerHTML = '';

    let totalPatrimonio = 0;
    let totalInvestido = 0;
    let totalDividendosMensais = 0;

    wallet.forEach((item, index) => {
        const asset = DB_B3.find(a => a.ticker === item.ticker) || { price: item.avgPrice, lastDiv: 0, nextDiv: 'N/A' };
        const totalValue = item.qtd * asset.price;
        const investedValue = item.qtd * item.avgPrice;
        const monthlyDiv = item.qtd * asset.lastDiv;

        totalPatrimonio += totalValue;
        totalInvestido += investedValue;
        totalDividendosMensais += monthlyDiv;

        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-50/80 transition-colors';
        row.innerHTML = `
            <td class="p-4 font-bold text-slate-900">${item.ticker}</td>
            <td class="p-4 text-right font-semibold text-slate-700">${item.qtd}</td>
            <td class="p-4 text-right font-medium text-slate-600">${formatMoney(item.avgPrice)}</td>
            <td class="p-4 text-right font-bold text-slate-900">${formatMoney(asset.price)}</td>
            <td class="p-4 text-center font-medium text-slate-500">${asset.nextDiv}</td>
            <td class="p-4 text-center">
                <button onclick="removeFromWallet(${index})" class="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <i class="ph-bold ph-trash text-lg"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    const profit = totalPatrimonio - totalInvestido;
    document.getElementById('wallet-total').innerText = formatMoney(totalPatrimonio);
    
    const profitEl = document.getElementById('wallet-profit');
    profitEl.innerText = formatMoney(profit);
    profitEl.className = profit >= 0 ? 'text-3xl font-black text-emerald-600' : 'text-3xl font-black text-red-600';

    document.getElementById('wallet-upcoming-divs').innerText = formatMoney(totalDividendosMensais);

    // Barra de Progresso da Meta (Meta arbitrária de R$ 100.000,00)
    const goalTarget = 100000;
    const progressPct = Math.min(100, Math.round((totalPatrimonio / goalTarget) * 100));
    document.getElementById('goal-progress-bar').style.width = `${progressPct}%`;
    document.getElementById('goal-progress-text').innerText = `${progressPct}% alcançado`;

    renderAllocationChart();
};

const removeFromWallet = (index) => {
    const removedItem = wallet[index];
    wallet.splice(index, 1);
    localStorage.setItem('investProWallet', JSON.stringify(wallet));
    showToast(`${removedItem.ticker} removido da carteira.`, 'warning');
    updateWalletView();
};

// Gráfico de Pizza de Alocação
const renderAllocationChart = () => {
    const ctx = document.getElementById('allocationChart').getContext('2d');
    
    if (allocationChartInstance) {
        allocationChartInstance.destroy();
    }

    if (wallet.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return;
    }

    const labels = wallet.map(w => w.ticker);
    const dataValues = wallet.map(w => {
        const asset = DB_B3.find(a => a.ticker === w.ticker);
        return w.qtd * (asset ? asset.price : w.avgPrice);
    });
    const backgroundColors = wallet.map(w => {
        const asset = DB_B3.find(a => a.ticker === w.ticker);
        return asset ? asset.color : '#64748b';
    });

    allocationChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { family: 'Inter', weight: '600' } }
                }
            }
        }
    });
};

// Integração com API Externa (AwesomeAPI)
const fetchGlobalRates = async () => {
    const errorContainer = document.getElementById('api-error');
    const resultsGrid = document.getElementById('api-results');
    
    errorContainer.classList.add('hidden');
    resultsGrid.classList.add('hidden');

    try {
        const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,GBP-BRL');
        if (!res.ok) throw new Error('Erro na requisição');
        
        const data = await res.json();
        resultsGrid.innerHTML = '';

        const currencies = [
            { key: 'USDBRL', name: 'Dólar Americano', symbol: '$', icon: 'ph-currency-dollar' },
            { key: 'EURBRL', name: 'Euro', symbol: '€', icon: 'ph-currency-eur' },
            { key: 'GBPBRL', name: 'Libra Esterlina', symbol: '£', icon: 'ph-currency-gbp' },
            { key: 'BTCBRL', name: 'Bitcoin', symbol: '₿', icon: 'ph-currency-btc' }
        ];

        currencies.forEach(c => {
            const item = data[c.key];
            if (!item) return;

            const pctChange = parseFloat(item.pctChange);
            const isPositive = pctChange >= 0;

            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between';
            card.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <span class="text-slate-500 font-bold text-sm uppercase">${c.name}</span>
                    <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl">
                        <i class="ph ${c.icon}"></i>
                    </div>
                </div>
                <div>
                    <h3 class="text-3xl font-black text-slate-900">${formatMoney(parseFloat(item.bid))}</h3>
                    <div class="mt-2 text-sm font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-red-600'}">
                        <i class="ph-bold ${isPositive ? 'ph-trend-up' : 'ph-trend-down'}"></i>
                        ${isPositive ? '+' : ''}${pctChange.toFixed(2)}%
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-400 font-medium">
                    <span>Máx: ${formatMoney(parseFloat(item.high))}</span>
                    <span>Mín: ${formatMoney(parseFloat(item.low))}</span>
                </div>
            `;
            resultsGrid.appendChild(card);
        });

        resultsGrid.classList.remove('hidden');
    } catch (err) {
        errorContainer.classList.remove('hidden');
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    renderAssets(DB_B3);
    updateWalletView();
});