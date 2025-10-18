import Product from "../models/product.model.js";

// Normalize cart to schema shape: [{ product: ObjectId, quantity: Number }]
function normalizeCartItems(cartItems) {
    if (!Array.isArray(cartItems)) return [];
    return cartItems.map((item) => {
        // Already in expected shape
        if (item && item.product) {
            return {
                product: item.product,
                quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
            };
        }
        // Backward compatibility: plain ObjectId/string
        return { product: item, quantity: 1 };
    });
}

export const getCartProducts = async (req, res) => {
	try {

		// Ensure consistent structure for any legacy data
		req.user.cartItems = normalizeCartItems(req.user.cartItems);

		// Extract product ObjectIds
		const productIds = req.user.cartItems.map((ci) => ci.product);
		const products = await Product.find({ _id: { $in: productIds } }).lean();

		// Build a map for quick quantity lookup
		const productIdToQuantity = new Map(
			req.user.cartItems.map((ci) => [ci.product.toString(), ci.quantity])
		);

		// Merge product docs with quantities
		const cartItems = products.map((p) => ({
			...p,
			quantity: productIdToQuantity.get(p._id.toString()) || 1,
		}));

		res.json(cartItems);
	} catch (error) {
		console.log("Error in getCartProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const addToCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = req.user;

		// Normalize first (handles legacy array of ids)
		user.cartItems = normalizeCartItems(user.cartItems);

		// Find by matching nested product ObjectId
		const existingItem = user.cartItems.find(
			(item) => item.product.toString() === productId
		);
		if (existingItem) {
			existingItem.quantity += 1;
		} else {
			// Store as { product: ObjectId, quantity }
			user.cartItems.push({ product: productId, quantity: 1 });
		}

		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		console.log("Error in addToCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeAllFromCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = req.user;
		user.cartItems = normalizeCartItems(user.cartItems);
		if (!productId) {
			user.cartItems = [];
		} else {
			user.cartItems = user.cartItems.filter(
				(item) => item.product.toString() !== productId
			);
		}
		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateQuantity = async (req, res) => {
	try {
		const { id: productId } = req.params;
		const { quantity } = req.body;
		const user = req.user;
		user.cartItems = normalizeCartItems(user.cartItems);
		const existingItem = user.cartItems.find(
			(item) => item.product.toString() === productId
		);

		if (existingItem) {
			if (quantity === 0) {
				user.cartItems = user.cartItems.filter(
					(item) => item.product.toString() !== productId
				);
				await user.save();
				return res.json(user.cartItems);
			}

			existingItem.quantity = quantity;
			await user.save();
			res.json(user.cartItems);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in updateQuantity controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
