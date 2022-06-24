dashboard = {
  diskData: [
    {
      "id": 1,
      "nome": "Maria",
      "salario": 2000
    },
    {
      "id": 2,
      "nome": "Carlos",
      "salario": 1500
    },
    {
      "id": 3,
      "nome": "Paola",
      "salario": 2200
    },
    {
      "id": 4,
      "nome": "Emília",
      "salario": 1800
    },
    {
      "id": 5,
      "nome": "Otávio",
      "salario": 1400
    },
  ],
  logMemoryData: [],
  bufferMemoryData: [],
  logDisk: [],
  insertTable: function (elementToInsert, tableName, data) {
    const keys = [...data.reduce((all, obj) => {
      Object.keys(obj).forEach(key => all.add(key));
      return all;
    }, new Set())];

    const
    header = keys.map(key => `<th>${key}</th>`).join(''),
    tbody = data.map(row => keys.map(key => `<td>${row[key]}</td>`).join('')).map(row => `<tr>${row}</tr>`).join(''),
    finalTable = `<table><caption class="title">${tableName}</caption><thead><tr>${header}</tr></thead> <tbody>${tbody}</body></table>`;

    elementToInsert.innerHTML = finalTable;

  },
  executeTransaction: function () {
    const
    transactions = document.querySelectorAll('[data-transaction]'),
    memoryLogTable = document.querySelector('[data-memory-log]'),
    memoryBufferTable = document.querySelector('[data-memory-buffer]');

    transactions.length > 0 && transactions.forEach(transaction => {
      const transacationForm = transaction.querySelector(".sql");

      transacationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const
        columnToCompare = transacationForm.querySelector('input[name="where"]')?.value,
        valueToCompare = transacationForm.querySelector('input[name="comparison"]')?.value,
        newSalary = Number(transacationForm.querySelector('input[name="set_value"]')?.value),
        employee = dashboard.diskData.find((obj) => obj[columnToCompare] == valueToCompare ), //busca o objeto que possui o parâmetro utilizado no "where"
        salary = employee['salario'],
        updatedEmployee = { ...employee, salario: newSalary }

        const memoryLogInfos = {
          "Transaction": `Transação ${transacationForm.querySelector('input[name="transaction_number"]').value}`,
          "Tabela": "Funcionário",
          "Linha": valueToCompare,
          "Atributo": "Salário",
          "Antes": salary,
          "Depois": newSalary,
          "Status": "Início"
        }

        //Atualiza arrays
        dashboard.logMemoryData.push(memoryLogInfos)
        dashboard.bufferMemoryData.push(updatedEmployee);

        //Insere as tabelas temporárias
        this.insertTable(memoryLogTable, "Memória - Buffer LOG", dashboard.logMemoryData);
        this.insertTable(memoryBufferTable, "Memória - Buffer Dados", dashboard.bufferMemoryData);
        
        transacationForm.reset();
      })

      // Commitar Transações
      const commitButton = transaction.querySelector('[data-commit]');

      commitButton.addEventListener('click', (e) => {
        transaction.dataset.transaction = "Fim";
        const commitTransaction = dashboard.logMemoryData.map(element => {
          if(element.Transaction == transaction.dataset.name) {
            return {...element, "Status": "Final"}
          } else {
            return element;
          }
        });
        dashboard.logMemoryData = commitTransaction;
        this.insertTable(memoryLogTable, "Memória - Buffer LOG", dashboard.logMemoryData);
      });
    })
  },
  checkpoint: function () {
    const _this = this;
    const checkpointButton = document.querySelector('[data-checkpoint]');
    checkpointButton.addEventListener('click', () => {
      const diskLog = document.querySelector('[data-disk]');
      const diskData2 = document.querySelector('[data-disk-data]');
      _this.insertTable(diskLog, "Disco - LOG", dashboard.logMemoryData);
      dashboard.logDisk = dashboard.logMemoryData;
  
      const updateDisk = dashboard.diskData.map(el => {
        const newData = dashboard.bufferMemoryData.find(el2 => el2.id === el.id);
        return newData ? newData : el;
      });
      
      dashboard.diskData = updateDisk;
      _this.insertTable(diskData2, "Disco - Dados", updateDisk);
    });
  },
  recovery: function () {
    const
    transactions = document.querySelectorAll('[data-transaction]');

    transactions.length > 0 && transactions.forEach(transaction => {
      
    });
  },
  init: function () {
    const diskData = document.querySelector('[data-disk-data]');
    this.insertTable(diskData, "Disco - Dados", dashboard.diskData);
    this.executeTransaction();
    this.checkpoint();

  }
}

window.addEventListener('DOMContentLoaded', () => {
  dashboard.init();
});