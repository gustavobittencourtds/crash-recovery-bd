dashboard = {
  diskData: [
    {
      "id": 1,
      "nome": "Maria",
      "salario": 2000,
      "salvo": "Sim"
    },
    {
      "id": 2,
      "nome": "Carlos",
      "salario": 1500,
      "salvo": "Sim"
    },
    {
      "id": 3,
      "nome": "Paola",
      "salario": 2200,
      "salvo": "Sim"
    },
    {
      "id": 4,
      "nome": "Emília",
      "salario": 1800,
      "salvo": "Sim"
    },
    {
      "id": 5,
      "nome": "Otávio",
      "salario": 1400,
      "salvo": "Sim"
    },
  ],
  diskDataTemporary:[],
  logMemoryData: [],
  bufferMemoryData: [],
  logDisk: [],
  undoTransactions: [],
  redoTransactions: [],
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

    dashboard.diskDataTemporary = dashboard.diskData;

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
        updatedEmployee = { ...employee, salario: newSalary, salvo: "Não" }

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
        
        //transacationForm.reset();
      })

      // Commitar Transações
      const commitButton = transaction.querySelector('[data-commit]');

      commitButton.addEventListener('click', (e) => {
        const
          valueToCompare = transaction.querySelector('input[name="comparison"]').value,
          newSalary = Number(transacationForm.querySelector('input[name="set_value"]').value)
      
        transaction.dataset.transaction = "Fim";
        const commitedTransactionLogMemory = dashboard.logMemoryData.map(element => {
          if(element.Transaction == transaction.dataset.name) {
            return {...element, "Status": "Finalizada"}
          } else {
            return element;
          }
        });

        const commitedTransactionBufferMemory = dashboard.bufferMemoryData.map(element => {
          if (element.id == valueToCompare) {
            return { ...element, "salvo": "Sim" }
          } else {
            return element;
          }
        });

        const commitedTransactionDataDiskTemporary = dashboard.diskData.map(element => {
          if (element.id == valueToCompare) {
            return { ...element, "salario": newSalary }
          } else {
            return element;
          }
        });

        const commitedTransactionDataDisk = dashboard.diskData.map(element => {
          if (element.id == valueToCompare) {
            return { ...element, "salario": newSalary }
          } else {
            return element;
          }
        });

        dashboard.logMemoryData = commitedTransactionLogMemory;
        dashboard.bufferMemoryData = commitedTransactionBufferMemory;
        dashboard.diskData = commitedTransactionDataDisk;
        dashboard.diskDataTemporary = commitedTransactionDataDiskTemporary;

        this.insertTable(memoryLogTable, "Memória - Buffer LOG", dashboard.logMemoryData);
        this.insertTable(memoryBufferTable, "Memória - Buffer Dados", dashboard.bufferMemoryData);

      });
    })
  },
  checkpoint: function () {
    const _this = this;
    const checkpointButton = document.querySelector('[data-checkpoint]');
    checkpointButton.addEventListener('click', () => {
      const
      diskLog = document.querySelector('[data-disk]'),
      diskData2 = document.querySelector('[data-disk-data]'),
      memoryLogTable = document.querySelector('[data-memory-log]');


      const checkpointLine = {
        "Transaction": "Checkpoint",
        "Tabela": "-",
        "Linha": "-",
        "Atributo": "-",
        "Antes": "-",
        "Depois": "-",
        "Status": "-",
      }

      dashboard.logMemoryData.push(checkpointLine);
      this.insertTable(memoryLogTable, "Memória - Buffer LOG", dashboard.logMemoryData);

      dashboard.logDisk = dashboard.logMemoryData;
      _this.insertTable(diskLog, "Disco - LOG", dashboard.logDisk);



      dashboard.logMemoryData.map(element => {
        
        if(element.Status != '-') {
          if(element.Status == 'Início'){
            dashboard.undoTransactions.push(element)
          }else {
            element.Status = 'C - Finalizada';
          }
        }
      });

      const updateDiskTemporary = dashboard.diskDataTemporary.map(el => {
        const newDataTemporary = dashboard.bufferMemoryData.find(el2 => el2.id === el.id);
        return newDataTemporary ? newDataTemporary : el;
      });

      dashboard.diskDataTemporary = updateDiskTemporary;

      _this.insertTable(diskData2, "Disco - Dados", dashboard.diskDataTemporary);
    });
  },
  simulateFailures: function () {
    const dashboardWrapper = document.querySelector('.dashboard');
    const buttonError = document.querySelector('[data-error]');

    buttonError.addEventListener('click', ()=> {
      dashboardWrapper.classList.add('-failure');
    })

  },
  recovery: function () {
    const
    buttonRecovery = document.querySelector('[data-recovery]'),
    dashboardWrapper = document.querySelector('.dashboard'),
    diskData2 = document.querySelector('[data-disk-data]'),
    diskLog = document.querySelector('[data-disk]'),
    memoryLogTable = document.querySelector('[data-memory-log]'),
    memoryBufferTable = document.querySelector('[data-memory-buffer]');

    buttonRecovery.addEventListener('click', ()=> {
      dashboard.logMemoryData.map(element => {
        if (element.Status != '-') {
          if (element.Status == 'Finalizada') dashboard.redoTransactions.push(element)
        }
      });
      
      
      console.log('UNDO: ')
      console.table(dashboard.undoTransactions)

      console.log('\n\nREDO: ')
      console.table(dashboard.redoTransactions)

      const clearTableLog = {
        "Transaction": "-",
        "Tabela": "-",
        "Linha": "-",
        "Atributo": "-",
        "Antes": "-",
        "Depois": "-",
        "Status": "-",
      }

      const clearTableBuffers = {
        "id": "-",
        "nome": "-",
        "salario": "-",
        "salvo": "-",
      }

      dashboard.logMemoryData = [];
      dashboard.logMemoryData.push(clearTableLog);
      
      dashboard.logDisk = [];
      dashboard.logDisk.push(clearTableLog);


      dashboard.bufferMemoryData = [];
      dashboard.bufferMemoryData.push(clearTableBuffers);
      
      this.insertTable(memoryLogTable, "Memória - Buffer LOG", dashboard.logMemoryData);
      this.insertTable(diskLog, "Disco - LOG", dashboard.logDisk);
      this.insertTable(memoryBufferTable, "Memória - Buffer Dados", dashboard.bufferMemoryData);

      dashboardWrapper.classList.remove('-failure');
      this.insertTable(diskData2, "Disco - Dados", dashboard.diskData);

      dashboard.diskDataTemporary = dashboard.diskData;
    })

  },
  init: function () {
    const diskData = document.querySelector('[data-disk-data]');
    this.insertTable(diskData, "Disco - Dados", dashboard.diskData);
    this.executeTransaction();
    this.checkpoint();
    this.simulateFailures();
    this.recovery();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  dashboard.init();
});