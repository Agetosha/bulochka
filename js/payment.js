document.addEventListener('DOMContentLoaded', () => {
    // Получаем данные из sessionStorage
    let orderItems;
    try {
        orderItems = JSON.parse(sessionStorage.getItem('orderItems')) || [];
    } catch (e) {
        console.error('Error parsing order items:', e);
        orderItems = [];
    }
    
    const total = parseFloat(sessionStorage.getItem('orderTotal')) || 0;
    const customerName = sessionStorage.getItem('customerName') || 'не указано';
    const customerPhone = sessionStorage.getItem('customerPhone') || 'не указано';
    const customerComment = sessionStorage.getItem('customerComment') || 'не указано';
    
    console.log('Loaded from sessionStorage:', {
        orderItems,
        total,
        customerName,
        customerPhone,
        customerComment
    });
    
    // Отображаем заказ
    const orderItemsEl = document.getElementById('order-items');
    const orderTotalEl = document.getElementById('order-total');
    
    if (!orderItemsEl || !orderTotalEl) {
        console.error('Order elements not found!');
        return;
    }
    
    if (orderItems.length === 0) {
        orderItemsEl.innerHTML = '<p>Заказ пуст</p>';
        document.getElementById('confirm-payment').disabled = true;
    } else {
        orderItemsEl.innerHTML = '';
        orderItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'order-item';
            itemEl.innerHTML = `<p>${item.name} x ${item.quantity} - ${(item.price * item.quantity).toFixed(2)} руб.</p>`;
            orderItemsEl.appendChild(itemEl);
        });
        document.getElementById('confirm-payment').disabled = false;
    }
    orderTotalEl.textContent = `Итого: ${total.toFixed(2)} руб.`;
    
    // Выбор способа оплаты
    const paymentMethods = document.querySelectorAll('.payment-method');
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            paymentMethods.forEach(m => m.classList.remove('selected'));
            method.classList.add('selected');
            method.querySelector('input').checked = true;
        });
    });
    
    // Подтверждение оплаты
    const confirmBtn = document.getElementById('confirm-payment');
        if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
        const selectedMethod = document.querySelector('input[name="payment"]:checked');
        
        if (!selectedMethod) {
            alert('Пожалуйста, выберите способ оплаты');
            return;
        }
        
        // Используем value из выбранного радио-элемента
        const method = selectedMethod.value;
        
        try {
            // Для ВСЕХ способов оплаты отправляем заказ в Telegram
            const result = await sendToTelegram(
                orderItems,
                total,
                method,  // Используем человекочитаемое название
                customerName,
                customerPhone,
                customerComment
            );
            console.log('Результат отправки:', result);
            
            // Обработка разных методов оплаты
            if (method === 'sbp') {
                // Для СБП показываем QR-код
                const sbpLink = generateSBPLink(total);
                showQRWindow(sbpLink, total);
            } else if (method === 'card') {
                // Для карты показываем предупреждение
                alert(`Перенаправление на страницу оплаты картой на сумму ${total.toFixed(2)} руб.`);
            }
            
            // Для ВСЕХ методов завершаем заказ
            completeOrder(method, total);
            
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при отправке заказа! Сообщите нам по телефону.');
        }
    });
}
});

// Генерация ссылки для СБП (замените на реальную логику)
function generateSBPLink(total) {
    // Это пример - замените на реальную интеграцию с платежной системой
    const bank = 'tinkoff'; // Пример банка
    return `https://qr.nspk.ru/ABC123/${bank}/${total.toFixed(2)}?type=02&bank=${bank}&sum=${total.toFixed(2)}`;
}

function processCardPayment(total) {
    // Здесь должна быть интеграция с платежным шлюзом
    alert(`Перенаправление на страницу оплаты картой на сумму ${total.toFixed(2)} руб.`);
    completeOrder('card', total);
}

// async function processSBPPayment(total, orderItems, name, phone, comment) {
//     try {
//         // 1. Сначала отправляем в Telegram
//         const result = await sendToTelegram(orderItems, total, 'sbp', name, phone, comment);
//         console.log('Результат отправки:', result);
        
//         // 2. Показываем QR-код только после успешной отправки
//         const sbpLink = generateSBPLink(total);
//         const qrWindow = window.open('', '_blank');
//         qrWindow.document.write(`
//             <!DOCTYPE html>
//             <html>
//             <head><title>Оплата</title></head>
//             <body>
//                 <h1>Оплата через СБП</h1>
//                 <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sbpLink)}">
//             </body>
//             </html>
//         `);
        
//         // 3. Очищаем корзину
//         sessionStorage.clear();
        
//     } catch (error) {
//         console.error('Ошибка:', error);
//         alert('Ошибка при отправке заказа! Сообщите нам по телефону.');
//     }
// }

function showQRWindow(sbpLink, total) {
    const qrWindow = window.open('', '_blank', 'width=600,height=700');
    qrWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Оплата через СБП</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    max-width: 500px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                h1 { 
                    color: #d2691e; 
                    margin-bottom: 10px;
                }
                img { 
                    max-width: 300px; 
                    margin: 20px auto; 
                    display: block;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 10px;
                    background: white;
                }
                p { 
                    margin: 10px 0; 
                    font-size: 16px;
                    color: #555;
                }
                .amount {
                    font-size: 24px;
                    font-weight: bold;
                    color: #2e7d32;
                    margin: 15px 0;
                }
                .instructions {
                    background: #f0f7ff;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    text-align: left;
                }
                .instruction-step {
                    margin-bottom: 10px;
                    display: flex;
                }
                .step-number {
                    background: #4caf50;
                    color: white;
                    width: 25px;
                    height: 25px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 10px;
                    flex-shrink: 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Оплата через СБП</h1>
                <p class="amount">${total.toFixed(2)} руб.</p>
                
                <div class="instructions">
                    <div class="instruction-step">
                        <div class="step-number">1</div>
                        <div>Откройте приложение вашего банка</div>
                    </div>
                    <div class="instruction-step">
                        <div class="step-number">2</div>
                        <div>Выберите "Оплата по QR-коду"</div>
                    </div>
                    <div class="instruction-step">
                        <div class="step-number">3</div>
                        <div>Наведите камеру на код</div>
                    </div>
                </div>
                
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(sbpLink)}" 
                     alt="QR-код для оплаты">
                
                <p>Или перейдите по <a href="${sbpLink}" target="_blank">ссылке</a></p>
                <p>После оплаты закройте это окно</p>
            </div>
        </body>
        </html>
    `);
}


function completeOrder(paymentMethod, total) {
    
    // Показываем сообщение об успехе
    alert(`Заказ успешно оформлен! Способ оплаты: ${paymentMethod}`);
    
    // Перенаправляем на главную через 5 секунд
    setTimeout(() => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    }, 5000);
}

async function sendToTelegram(orderItems, total, paymentMethod, name, phone, comment) {
    const orderText = orderItems.map(item => 
        `${item.name} x${item.quantity} - ${(item.price * item.quantity).toFixed(2)} руб.`
    ).join('\n');
    
    const formData = new URLSearchParams();
    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('payment_method', paymentMethod); // Уже человекочитаемое значение
    formData.append('total', total.toFixed(2));
    formData.append('comment', comment);
    formData.append('order', orderText);

    try {
        const response = await fetch('php/send_order.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.text();
    } catch (error) {
        console.error('Ошибка при отправке:', error);
        throw error;
    }
}