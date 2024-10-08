const express = require('express');
const {
    seedDatabase,
    getTransactions,
    getStatistics,
    getPriceRange,
    getCategoryData,
    getCombinedData
} = require('../controllers/transactionsController');

const router = express.Router();
const fetchStats = async () => {
    try {
        const response = await axios.get('/api/statistics'); // Use the correct route
        // Handle response
    } catch (error) {
        console.error("Error fetching stats:", error);
    }
};


router.get('/seed', seedDatabase);         // API to seed the database
router.get('/', getTransactions);          // API to get transactions with pagination and search
router.get('/statistics', getStatistics);  // API to get statistics
router.get('/price-range', getPriceRange); // API to get bar chart price range data
router.get('/category', getCategoryData);  // API to get pie chart category data
router.get('/combined', getCombinedData);  // API to get combined data

module.exports = router;
