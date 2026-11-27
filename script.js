const input = document.querySelector("#text-field");
const numberButtons = document.querySelectorAll(".num-buttons");
const operatorButtons = document.querySelectorAll(".operator-buttons");
const functionButtons = document.querySelectorAll(".function-buttons");
const equalsBtn = document.querySelector("#btn-equals");
const operators = "+-/*"
const numbers = "1234567890. "

const historyList = document.querySelector("#history-list");
const clearHistoryBtn = document.querySelector("#btn-clear-history");
const historyKey = "calculator-history";
let operationHistory = [];

try {
    const savedHistory = JSON.parse(localStorage.getItem(historyKey));
    if (Array.isArray(savedHistory)) {
        operationHistory = savedHistory.filter(item => typeof item === "string").slice(0, 5);
    }
} catch {
    // The calculator still works when browser storage is unavailable.
}

function renderHistory() {
    historyList.replaceChildren();
    for (const operation of operationHistory) {
        const item = document.createElement("li");
        item.textContent = operation;
        historyList.appendChild(item);
    }
    clearHistoryBtn.disabled = operationHistory.length === 0;
}

function saveHistory() {
    try {
        localStorage.setItem(historyKey, JSON.stringify(operationHistory));
    } catch {
        // Keep the current session's history if storage cannot be written.
    }
    renderHistory();
}

clearHistoryBtn.addEventListener("click", () => {
    operationHistory = [];
    saveHistory();
});

renderHistory();

console.log(numberButtons, operatorButtons, functionButtons);

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        runCalculator();
    }
});

equalsBtn.addEventListener("click", (event) => {
    runCalculator();
})

for (let i = 0; i < numberButtons.length; i++) {
    const value = (i + 1) % 10;

    numberButtons[i].addEventListener("click", () => {
        input.value += value;
    });
}

for (let i = 0; i < operatorButtons.length; i++) {
    let indexOfOperator = 0;
    if (operatorButtons[i].textContent === "=") {
        continue;
    }
    operatorButtons[i].addEventListener("click", () => {
        const currentOperation = input.value;
        const operator = operatorButtons[i].textContent;
        console.log(operatorButtons[i].textContent)
        if (
            currentOperation.includes("+") ||
            currentOperation.includes("-") ||
            currentOperation.includes("*") ||
            currentOperation.includes("/")
        ) {
            if (checkValidity(currentOperation)) {
                const result = calculate(currentOperation);

                if (result !== undefined) {
                    input.value = result + operator;
                }
            }
        } else {
            input.value += operator;
        }
    })
}

for (let i = 0; i < functionButtons.length; i++) {
    functionButtons[i].addEventListener("click", () => {
        if (functionButtons[i].textContent === "C") {
            input.value = ""
        }
        if (functionButtons[i].textContent === "Del") {
            input.value = input.value.slice(0, -1);
        }
    });
}

function checkValidity(str) {
    let invalid = false;
    if (
        str.startsWith("+") || str.endsWith("+") ||
        str.startsWith("-") || str.endsWith("-") ||
        str.startsWith("*") || str.endsWith("*") ||
        str.startsWith("/") || str.endsWith("/")
    ) {
        input.value = "ERR";
        invalid = true;
    }
    for (let i = 0; i < str.length; i++) {
        if (!operators.includes(str[i]) && !numbers.includes(str[i])) {
            input.value = "ERR";
            invalid = true;
        }
        if (operators.includes(str[i]) && operators.includes(str[i + 1])) {
            input.value = "ERR";
            invalid = true;
        }
    }
    if (!invalid) {
        return true;
    }
    else {
        return false;
    }
}

function calculate(operation) {
    const operationArr = operation.replaceAll(" ", "").split(/([+\-*/])/);
    let result = Number(operationArr[0]);
    console.log(operationArr);

    for (let i = 1; i < operationArr.length; i += 2) {
        const operator = operationArr[i];
        const value = Number(operationArr[i + 1]);

        switch (operator) {
            case "+":
                result += value;
                console.log(result);
                break;
            case "-":
                result -= value;
                console.log(result);
                break;
            case "*":
                result *= value;
                console.log(result);
                break;
            case "/":
                if (value === 0) {
                    input.value = "ERR";
                    console.log("ERR");
                    return;
                }
                result /= value;
                break;
        }
        input.value = result;
    }

    const hasValidOperands = operationArr.every((part, index) =>
        index % 2 === 1 || (part !== "" && Number.isFinite(Number(part)))
    );
    if (operationArr.length > 1 && hasValidOperands && Number.isFinite(result)) {
        operationHistory.unshift(`${operation.trim()} = ${result}`);
        operationHistory = operationHistory.slice(0, 5);
        saveHistory();
    }

    return result;
}

function runCalculator() {
    const currentOperation = input.value;
    console.log(currentOperation);
    if (checkValidity(currentOperation)) {
        calculate(currentOperation);
    }
}
