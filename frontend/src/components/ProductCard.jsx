import toast from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react"; // local img fallback handling
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const ProductCard = ({ product }) => {
	// Use a local state so we can swap to a fallback image if the primary fails
	const fallbackImageSrc = "/screenshot-for-readme.png"; // lives in public/
	const [imageSrc, setImageSrc] = useState(product?.image || fallbackImageSrc);

	// Keep image in sync if the product changes
	useEffect(() => {
		setImageSrc(product?.image || fallbackImageSrc);
	}, [product]);
	const { user } = useUserStore();
	const { addToCart } = useCartStore();
	const handleAddToCart = () => {
		if (!user) {
			toast.error("Please login to add products to cart", { id: "login" });
			return;
		} else {
			// add to cart
			addToCart(product);
		}
	};

	return (
		<div className='flex w-full relative flex-col overflow-hidden rounded-lg border border-gray-700 shadow-lg'>
			<div className='relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl'>
				{/* Ensure image fills the wrapper and gracefully falls back if the source fails */}
				<img
					className='object-cover w-full h-full'
					src={imageSrc}
					alt='product image'
					loading='lazy'
					onError={() => setImageSrc(fallbackImageSrc)}
				/>
				{/* Soft tint overlay; using slash opacity to avoid full black in case bg-opacity utilities aren't active */}
				<div className='absolute inset-0 bg-black/20 pointer-events-none' />
			</div>

			<div className='mt-4 px-5 pb-5'>
				<h5 className='text-xl font-semibold tracking-tight text-white'>{product.name}</h5>
				<div className='mt-2 mb-5 flex items-center justify-between'>
					<p>
						<span className='text-3xl font-bold text-emerald-400'>${product.price}</span>
					</p>
				</div>
				<button
					className='flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-center text-sm font-medium
					 text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300'
					onClick={handleAddToCart}
				>
					<ShoppingCart size={22} className='mr-2' />
					Add to cart
				</button>
			</div>
		</div>
	);
};
export default ProductCard;
