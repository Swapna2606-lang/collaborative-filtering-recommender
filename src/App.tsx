import React, { useState, useMemo } from 'react';
import {
  Product,
  User,
  UserInteraction,
  InteractionWeightsConfig,
  RecommendationAlgorithm,
  AlgorithmConfig,
  InteractionType
} from './types';
import {
  INITIAL_PRODUCTS,
  INITIAL_USERS,
  INITIAL_INTERACTIONS,
  DEFAULT_WEIGHTS
} from './data/mockData';
import {
  buildUserItemMatrix,
  computeUserSimilarityMatrix,
  computeItemSimilarityMatrix,
  userBasedCollaborativeFiltering,
  itemBasedCollaborativeFiltering,
  trainSVD,
  matrixFactorizationRecommendations,
  popularityBaseline
} from './engine/collaborativeFiltering';
import { Navbar } from './components/Navbar';
import { StorefrontView } from './components/StorefrontView';
import { DataCollectionView } from './components/DataCollectionView';
import { AlgorithmsView } from './components/AlgorithmsView';
import { EvaluationView } from './components/EvaluationView';
import { PythonCodeView } from './components/PythonCodeView';
import { ProductModal } from './components/ProductModal';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { Check } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'store' | 'data' | 'algorithms' | 'evaluation' | 'python'>('store');

  // Core Data State
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [users] = useState<User[]>(INITIAL_USERS);
  const [activeUserId, setActiveUserId] = useState<string>('user-current');
  const [interactions, setInteractions] = useState<UserInteraction[]>(INITIAL_INTERACTIONS);

  // Configuration State
  const [weightsConfig, setWeightsConfig] = useState<InteractionWeightsConfig>(DEFAULT_WEIGHTS);
  const [algorithm, setAlgorithm] = useState<RecommendationAlgorithm>('ubcf');
  const [algorithmConfig, setAlgorithmConfig] = useState<AlgorithmConfig>({
    neighborhoodK: 4,
    similarityMetric: 'cosine',
    latentFactors: 3,
    regularization: 0.05,
    iterations: 40
  });

  // Shopping & Interaction State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set(['prod-4']));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  const activeUser = useMemo(() => {
    return users.find((u) => u.id === activeUserId) || users[0];
  }, [users, activeUserId]);

  // Build the live User-Item Interaction Matrix R
  const userItemMatrix = useMemo(() => {
    return buildUserItemMatrix(interactions, users, products, weightsConfig);
  }, [interactions, users, products, weightsConfig]);

  // Compute similarity matrices
  const userSimMatrix = useMemo(() => {
    return computeUserSimilarityMatrix(userItemMatrix, algorithmConfig.similarityMetric);
  }, [userItemMatrix, algorithmConfig.similarityMetric]);

  const itemSimMatrix = useMemo(() => {
    return computeItemSimilarityMatrix(userItemMatrix, algorithmConfig.similarityMetric);
  }, [userItemMatrix, algorithmConfig.similarityMetric]);

  const svdModel = useMemo(() => {
    return trainSVD(
      userItemMatrix,
      algorithmConfig.latentFactors,
      0.02,
      algorithmConfig.regularization,
      algorithmConfig.iterations
    );
  }, [userItemMatrix, algorithmConfig]);

  // Real-time Recommendations for Active User
  const recommendations = useMemo(() => {
    switch (algorithm) {
      case 'ubcf':
        return userBasedCollaborativeFiltering(
          activeUserId,
          userItemMatrix,
          userSimMatrix,
          users,
          products,
          algorithmConfig,
          true
        );
      case 'ibcf':
        return itemBasedCollaborativeFiltering(
          activeUserId,
          userItemMatrix,
          itemSimMatrix,
          products,
          algorithmConfig,
          true
        );
      case 'svd':
        return matrixFactorizationRecommendations(
          activeUserId,
          userItemMatrix,
          svdModel,
          products,
          true
        );
      case 'popularity':
      default:
        return popularityBaseline(userItemMatrix, products, activeUserId);
    }
  }, [
    algorithm,
    activeUserId,
    userItemMatrix,
    userSimMatrix,
    itemSimMatrix,
    svdModel,
    users,
    products,
    algorithmConfig
  ]);

  // Similar products for the active product modal via Item-Item CF
  const similarProductsForModal = useMemo(() => {
    if (!selectedProduct) return [];
    const pIdx = userItemMatrix.productIndexMap[selectedProduct.id];
    if (pIdx === undefined) return [];

    return userItemMatrix.productIds
      .map((id, idx) => ({
        product: products.find((p) => p.id === id)!,
        similarity: itemSimMatrix[pIdx][idx]
      }))
      .filter((item) => item.product && item.product.id !== selectedProduct.id)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 2);
  }, [selectedProduct, userItemMatrix, itemSimMatrix, products]);

  // Append new interaction event
  const logInteraction = (
    userId: string,
    productId: string,
    type: InteractionType,
    rawVal: number
  ) => {
    const newInt: UserInteraction = {
      id: `int-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      productId,
      type,
      value: rawVal,
      normalizedScore:
        type === 'rating'
          ? rawVal
          : Math.min(5.0, 2.5 + (rawVal / 5.0) * 2.5),
      timestamp: Date.now()
    };

    setInteractions((prev) => [newInt, ...prev]);
  };

  // Interaction Handlers
  const handleViewProductDetails = (product: Product) => {
    setSelectedProduct(product);
    logInteraction(activeUserId, product.id, 'click_detail', weightsConfig.click_detail);
    showToast(`Logged detail view on "${product.name}" (+${weightsConfig.click_detail})`);
  };

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    logInteraction(activeUserId, product.id, 'add_to_cart', weightsConfig.add_to_cart);
    showToast(`Added to Bag (+${weightsConfig.add_to_cart} affinity signal)`);
  };

  const handleToggleWishlist = (product: Product) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
        showToast(`Removed from Wishlist`);
      } else {
        next.add(product.id);
        logInteraction(activeUserId, product.id, 'wishlist', weightsConfig.wishlist);
        showToast(`Added to Wishlist (+${weightsConfig.wishlist} intent signal)`);
      }
      return next;
    });
  };

  const handleRateProduct = (product: Product, rating: number) => {
    logInteraction(activeUserId, product.id, 'rating', rating);
    showToast(`Logged ${rating}★ explicit rating for "${product.name}"`);
  };

  const handlePurchaseNow = (product: Product) => {
    logInteraction(activeUserId, product.id, 'purchase', weightsConfig.purchase);
    showToast(`Purchase confirmed (+${weightsConfig.purchase} conversion signal)`);
  };

  const handleCheckout = () => {
    cart.forEach((item) => {
      logInteraction(activeUserId, item.product.id, 'purchase', weightsConfig.purchase);
    });
    setCart([]);
    showToast(`Simulated Order Confirmed! Logged purchases across ${cart.length} items`);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Generate synthetic user sessions
  const handleGenerateSynthetic = (count: number) => {
    const newItems: UserInteraction[] = [];
    const types: InteractionType[] = ['view', 'click_detail', 'wishlist', 'add_to_cart', 'purchase', 'rating'];

    for (let i = 0; i < count; i++) {
      const u = users[Math.floor(Math.random() * users.length)];
      const p = products[Math.floor(Math.random() * products.length)];
      const t = types[Math.floor(Math.random() * types.length)];
      const val = t === 'rating' ? Math.floor(Math.random() * 3) + 3 : weightsConfig[t as keyof InteractionWeightsConfig] || 1.0;

      newItems.push({
        id: `synth-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
        userId: u.id,
        productId: p.id,
        type: t,
        value: val,
        normalizedScore: t === 'rating' ? val : Math.min(5.0, 2.5 + (val / 5.0) * 2.5),
        timestamp: Date.now() - Math.floor(Math.random() * 3600000)
      });
    }

    setInteractions((prev) => [...newItems, ...prev]);
    showToast(`Ingested ${count} synthetic user interactions into matrix`);
  };

  const handleResetInteractions = () => {
    setInteractions(INITIAL_INTERACTIONS);
    showToast('Reset interaction history to initial seed dataset');
  };

  const handleAddManualInteraction = (
    userId: string,
    productId: string,
    type: InteractionType,
    value: number
  ) => {
    logInteraction(userId, productId, type, value);
    showToast(`Dispatched ${type} event for ${users.find((u) => u.id === userId)?.name}`);
  };

  const cartIds = useMemo(() => new Set(cart.map((c) => c.product.id)), [cart]);
  const cartTotalCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* Top Bar adhering to Top Bar Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeUser={activeUser}
        allUsers={users}
        setActiveUserId={setActiveUserId}
        cartCount={cartTotalCount}
        openCart={() => setIsCartOpen(true)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'store' && (
          <StorefrontView
            products={products}
            recommendations={recommendations}
            activeUser={activeUser}
            allUsers={users}
            setActiveUserId={setActiveUserId}
            currentAlgorithm={algorithm}
            setAlgorithm={setAlgorithm}
            algorithmConfig={algorithmConfig}
            setAlgorithmConfig={setAlgorithmConfig}
            onViewProductDetails={handleViewProductDetails}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            onRateProduct={handleRateProduct}
            wishlistIds={wishlistIds}
            cartIds={cartIds}
            onTriggerSimulation={() => handleGenerateSynthetic(5)}
          />
        )}

        {activeTab === 'data' && (
          <DataCollectionView
            interactions={interactions}
            users={users}
            products={products}
            weightsConfig={weightsConfig}
            setWeightsConfig={setWeightsConfig}
            userItemMatrix={userItemMatrix}
            onGenerateSyntheticInteractions={handleGenerateSynthetic}
            onResetInteractions={handleResetInteractions}
            onAddManualInteraction={handleAddManualInteraction}
          />
        )}

        {activeTab === 'algorithms' && (
          <AlgorithmsView
            userItemMatrix={userItemMatrix}
            users={users}
            products={products}
            algorithmConfig={algorithmConfig}
          />
        )}

        {activeTab === 'evaluation' && (
          <EvaluationView
            interactions={interactions}
            users={users}
            products={products}
            weightsConfig={weightsConfig}
            algorithmConfig={algorithmConfig}
          />
        )}

        {activeTab === 'python' && <PythonCodeView />}
      </main>

      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onPurchaseNow={handlePurchaseNow}
        onToggleWishlist={handleToggleWishlist}
        onRateProduct={handleRateProduct}
        isWishlisted={selectedProduct ? wishlistIds.has(selectedProduct.id) : false}
        similarProducts={similarProductsForModal}
        onSelectSimilarProduct={(p) => {
          setSelectedProduct(p);
          logInteraction(activeUserId, p.id, 'click_detail', weightsConfig.click_detail);
        }}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckout}
      />

      {/* Real-time Interaction Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500/50 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-2.5 text-xs text-slate-100 animate-in slide-in-from-bottom duration-200">
          <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">AURA Recommendation Engine</span>
            <span>·</span>
            <span>Collaborative Filtering (UBCF, IBCF, SVD)</span>
            <span>·</span>
            <span>Offline Holdout Evaluation</span>
          </div>
          <div className="font-mono text-[11px] text-slate-600">
            Precision@K & Recall@K Benchmark Suite
          </div>
        </div>
      </footer>
    </div>
  );
}
