const Transaction = require('../models/Transaction');
const axios = require('axios');

// Seed Database
exports.seedDatabase = async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        await Transaction.insertMany(response.data);
        res.status(200).json({ message: 'Database seeded successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error seeding the database' });
    }
};

// Get all transactions with pagination & search
exports.getTransactions = async (req, res) => {
    try {
        const { page = 1, perPage = 10, search = '', month } = req.query;
        const filter = { dateOfSale: { $regex: `${month}`, $options: 'i' } };
        
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { price: { $regex: search, $options: 'i' } }
            ];
        }
        
        const transactions = await Transaction.find(filter)
            .skip((page - 1) * perPage)
            .limit(Number(perPage));

        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching transactions' });
    }
};

// Get statistics for selected month
exports.getStatistics = async (req, res) => {
    try {
        const { month } = req.query;
        const filter = { dateOfSale: { $regex: `${month}`, $options: 'i' } };
        const totalSale = await Transaction.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: "$price" } } }
        ]);
        const soldItems = await Transaction.countDocuments({ ...filter, isSold: true });
        const notSoldItems = await Transaction.countDocuments({ ...filter, isSold: false });

        res.status(200).json({
            totalSaleAmount: totalSale[0]?.total || 0,
            totalSoldItems: soldItems,
            totalNotSoldItems: notSoldItems,
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching statistics' });
    }
};

// Get price range data for bar chart
exports.getPriceRange = async (req, res) => {
    try {
        const { month } = req.query;
        const filter = { dateOfSale: { $regex: `${month}`, $options: 'i' } };
        const priceRanges = [
            { range: "0-100", min: 0, max: 100 },
            { range: "101-200", min: 101, max: 200 },
            { range: "201-300", min: 201, max: 300 },
            { range: "301-400", min: 301, max: 400 },
            { range: "401-500", min: 401, max: 500 },
            { range: "501-600", min: 501, max: 600 },
            { range: "601-700", min: 601, max: 700 },
            { range: "701-800", min: 701, max: 800 },
            { range: "801-900", min: 801, max: 900 },
            { range: "901-above", min: 901, max: Infinity }
        ];

        const results = await Promise.all(priceRanges.map(async (range) => {
            const count = await Transaction.countDocuments({
                ...filter,
                price: { $gte: range.min, $lte: range.max }
            });
            return { range: range.range, count };
        }));

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching price range data' });
    }
};

// Get pie chart data (categories)
exports.getCategoryData = async (req, res) => {
    try {
        const { month } = req.query;
        const filter = { dateOfSale: { $regex: `${month}`, $options: 'i' } };
        const categories = await Transaction.aggregate([
            { $match: filter },
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching category data' });
    }
};

// Get combined data
exports.getCombinedData = async (req, res) => {
    try {
        const [transactions, statistics, priceRange, categoryData] = await Promise.all([
            this.getTransactions(req, res),
            this.getStatistics(req, res),
            this.getPriceRange(req, res),
            this.getCategoryData(req, res),
        ]);

        res.status(200).json({ transactions, statistics, priceRange, categoryData });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching combined data' });
    }
};
