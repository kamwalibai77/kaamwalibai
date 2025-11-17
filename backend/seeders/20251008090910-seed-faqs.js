"use strict";

export default {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    return queryInterface.bulkInsert(
      "Faqs",
      [
        {
          question: "How do I book a service provider?",
          answer:
            "Open the Home tab, choose the service you need, view provider profiles and tap 'Book' to start the booking flow.",
          createdAt: now,
          updatedAt: now,
        },
        {
          question: "What if a provider doesn't show up?",
          answer:
            "If a provider doesn't show up at the scheduled time, please contact support via the app or cancel the booking from your booking history.",
          createdAt: now,
          updatedAt: now,
        },
        {
          question: "How are providers verified?",
          answer:
            "Providers go through a basic identity verification and our team reviews their profile before allowing them to accept bookings.",
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete(
      "Faqs",
      {
        question: [
          "How do I book a service provider?",
          "What if a provider doesn't show up?",
          "How are providers verified?",
        ],
      },
      {}
    );
  },
};
