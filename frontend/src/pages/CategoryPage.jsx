import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import ProductCard from "../components/shop/ProductCard.jsx";

export default function CategoryPage() {
    const { slug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const [products, setProducts] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(Number(searchParams.get("page") || 1));
    const [totalPages, setTotalPages] = useState(1);

    const safeSlug = useMemo(() => String(slug || "").trim(), [slug]);

    useEffect(() => {
        setPage(1);
    }, [safeSlug]);

    useEffect(() => {
        const fetchCategoryProducts = async () => {
            if (!safeSlug) {
                setProducts([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const { data } = await api.get("/products", {
                    params: {
                        category: safeSlug,
                        page,
                    },
                });

                const productList = data?.data || [];
                setProducts(productList);
                setTotalPages(data?.last_page || 1);

                if (productList.length > 0) {
                    const detected = productList[0]?.category?.name || safeSlug;
                    setCategoryName(detected);
                } else {
                    setCategoryName(safeSlug.replace(/[-_]+/g, " "));
                }
            } catch (error) {
                setProducts([]);
                setTotalPages(1);
                setCategoryName(safeSlug.replace(/[-_]+/g, " "));
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryProducts();
    }, [safeSlug, page]);

    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        next.set("page", String(page));
        setSearchParams(next, { replace: true });
    }, [page, searchParams, setSearchParams]);

    return (
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 capitalize">{categoryName || "Category"}</h1>
                    <p className="text-sm text-zinc-500 mt-1">Showing products in this category.</p>
                </div>
                <Link to="/" className="text-sm font-semibold text-zinc-700 hover:text-zinc-900 underline">
                    Back to Home
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-4">
                    {Array.from({ length: 12 }).map((_, idx) => (
                        <div key={idx} className="fs-card overflow-hidden">
                            <div className="aspect-[4/5] bg-zinc-100 animate-pulse" />
                            <div className="p-3 sm:p-4">
                                <div className="h-3 w-2/3 bg-zinc-100 animate-pulse rounded" />
                                <div className="mt-2 h-3 w-1/3 bg-zinc-100 animate-pulse rounded" />
                                <div className="mt-3 h-7 w-20 bg-zinc-100 animate-pulse rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-600">
                    No products found for this category.
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-4">
                        {products.map((product) => (
                            <ProductCard key={product.id} p={product} />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            <button
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 rounded-lg border border-zinc-300 bg-white disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <span className="text-sm text-zinc-600">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 rounded-lg border border-zinc-300 bg-white disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
