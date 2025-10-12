"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("Plans", [
    {
      name: "Basic 7d",
      price: 99,
      currency: "INR",
      contacts: 3,
      duration: "7 Days",
      type: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Standard 15d",
      price: 199,
      currency: "INR",
      contacts: 10,
      duration: "15 Days",
      type: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Monthly 30d",
      price: 299,
      currency: "INR",
      contacts: 20,
      duration: "30 Days",
      type: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Growth 45d",
      price: 499,
      currency: "INR",
      contacts: 50,
      duration: "45 Days",
      type: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Provider 1M",
      price: 399,
      currency: "INR",
      contacts: null,
      duration: "1 Month",
      type: "provider",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Provider 6M",
      price: 999,
      currency: "INR",
      contacts: null,
      duration: "6 Months",
      type: "provider",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Provider 12M",
      price: 1799,
      currency: "INR",
      contacts: null,
      duration: "12 Months",
      type: "provider",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Provider 18M",
      price: 2499,
      currency: "INR",
      contacts: null,
      duration: "18 Months",
      type: "provider",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("Plans", null, {});
}
