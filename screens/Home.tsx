import { ScrollView, StyleSheet, Text, TextStyle, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Category, Transaction, TransactionsByMonth } from '../types'
import { useSQLiteContext } from 'expo-sqlite/next'
import TransactionList from '../components/TransactionList'
import Card from '../components/ui/Cards'
import AddTransaction from '../components/AddTransaction'

export default function Home() {

  let [categories, setCategories] = useState<Category[]>([])
  let [transactions, setTransactions] = useState<Transaction[]>([])
  let [transactionsByMonth, setTransactionsByMonth] = useState<TransactionsByMonth>({
    totalExpenses: 0,
    totalIncome: 0
  })





  const db = useSQLiteContext()



  async function getData() {
    try {
      const result = await db.getAllAsync<Transaction>(
        `SELECT * FROM  Transactions ORDER BY date DESC`);
      setTransactions(result)
      const categoriesResult = await db.getAllAsync<Category>(
        `SELECT * FROM  Categories`);
      setCategories(categoriesResult)

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      endOfMonth.setMilliseconds(endOfMonth.getMilliseconds() - 1);
      const startOfMonthTimestamp = Math.floor(startOfMonth.getTime() / 1000);
      const endOfMonthTimestamp = Math.floor(endOfMonth.getTime() / 1000);
      const transactionsByMonth = await db.getAllAsync<TransactionsByMonth>(
        `
         SELECT
              COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END), 0) AS totalExpenses,
              COALESCE(SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END), 0) AS totalIncome
            FROM Transactions
            WHERE date >= ? AND date <= ?;
          `,
        [startOfMonthTimestamp, endOfMonthTimestamp]
      );
      setTransactionsByMonth(transactionsByMonth[0]);

    } catch (error) {
      console.error("There is an error in getdata", error)
    }
  }

  useEffect(() => {
    db.withTransactionAsync(async () => {
      await getData()
    })
  }, [db])

  async function deleteTransaction(id: number) {
    db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM Transactions WHERE id = ?;`, [id])
      await getData();
    })
  }

  async function insertTransaction(transaction: Transaction) {
    db.withTransactionAsync(async () => {
      await db.runAsync(
        `
        INSERT INTO Transactions (category_id, amount, date, description, type) VALUES (?, ?, ?, ?, ?);
      `,
        [
          transaction.category_id,
          transaction.amount,
          transaction.date,
          transaction.description,
          transaction.type,
        ]
      );
      await getData();
    });
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 15, paddingVertical: 17 }}>
      <AddTransaction insertTransaction={insertTransaction}/>
      <TransactionSummary totalExpenses={transactionsByMonth.totalExpenses} totalIncome={transactionsByMonth.totalIncome} />
      <TransactionList
        categories={categories}
        transactions={transactions}
        deleteTransaction={deleteTransaction}
      />
    </ScrollView>
  )
}


function TransactionSummary({
  totalIncome,
  totalExpenses,

}: TransactionsByMonth) {
  const savings = totalIncome - totalExpenses;
  const readablePeriod = new Date().toLocaleDateString("default", {
    month: "long",
    year: "numeric",
  });


   const getMoneyTextStyle = (value: number): TextStyle => ({
    fontWeight: "bold",
    color: value < 0 ? "#ff4500" : "#2e8b57", 
  });



  const formatMoney = (value: number) => {
    const absValue = Math.abs(value).toFixed(2);
    return `${value < 0 ? "-" : ""}$${absValue}`;
  };
  return (
    <Card style={styles.container}>
      <Text style={styles.periodTitle}>Summary for {readablePeriod}</Text>
      <Text style={styles.summaryText}>
        Income:{" "}
        <Text style={getMoneyTextStyle(totalIncome)}>
          {formatMoney(totalIncome)}
        </Text>
      </Text>
      <Text style={styles.summaryText}>
        Total Expenses:{" "}
        <Text style={getMoneyTextStyle(totalExpenses)}>
          {formatMoney(totalExpenses)}
        </Text>
      </Text>
      <Text style={styles.summaryText}>
        Savings:{" "}
        <Text style={getMoneyTextStyle(savings)}>{formatMoney(savings)}</Text>
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    paddingBottom: 7,
  },
  periodTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 18,
    color: "#333",
    marginBottom: 10,
  },

})