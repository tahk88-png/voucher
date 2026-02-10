import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { useNavigate } from '@/lib/router-shim';
import { ArrowLeft, Search, Plus, Trash2, User, CreditCard, ShoppingBag, Calendar } from 'lucide-react';

export function CreateOrder() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<{id: string, name: string, price: number, quantity: number}[]>([]);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });

  // Mock Products
  const PRODUCTS = [
    { id: '1', name: 'Sony A7 III', price: 45.00, type: 'rental' },
    { id: '2', name: '24-70mm Lens', price: 25.00, type: 'rental' },
    { id: '3', name: 'SD Card 64GB', price: 19.90, type: 'sale' },
    { id: '4', name: 'Camera Bag', price: 35.00, type: 'sale' },
  ];

  const addToCart = (product: any) => {
    const existing = cart.find(p => p.id === product.id);
    if (existing) {
      setCart(cart.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(p => p.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-20">
      <div className="sticky top-0 z-30 bg-[#FAF7F2]/80 backdrop-blur-md border-b border-[#E7DCC7]">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#E7DCC7]/50 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-[#6B5744]" />
            </button>
            <h1 className="text-xl font-bold text-[#2D2721]">Uus manuaalne tellimus</h1>
          </div>
          <div className="flex gap-3">
             <WarmButton variant="ghost" onClick={() => navigate(-1)}>TÃ¼hista</WarmButton>
             <WarmButton className="gap-2" disabled={cart.length === 0 || !customer.name}>
               <CreditCard className="w-4 h-4" /> Loo tellimus ({total.toFixed(2)}â‚¬)
             </WarmButton>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-6">
           <WarmCard padding="lg" className="bg-white min-h-[500px]">
              <div className="flex items-center gap-4 mb-6">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
                    <input 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Otsi tooteid..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E7DCC7] focus:border-[#FFC857] outline-none"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 {PRODUCTS.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border border-[#E7DCC7] hover:border-[#FFC857] hover:bg-[#FFF9ED] transition-colors group">
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${product.type === 'rental' ? 'bg-[#3E352F] text-[#E17B5C]' : 'bg-[#FFF9ED] text-[#FFC857]'}`}>
                             {product.type === 'rental' ? <Calendar className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                          </div>
                          <div>
                             <div className="font-bold text-[#2D2721]">{product.name}</div>
                             <div className="text-xs text-[#8B7355]">{product.price.toFixed(2)}â‚¬</div>
                          </div>
                       </div>
                       <button onClick={() => addToCart(product)} className="p-2 bg-[#FAF7F2] rounded-lg text-[#2D2721] hover:bg-[#FFC857] transition-colors">
                          <Plus className="w-4 h-4" />
                       </button>
                    </div>
                 ))}
              </div>
           </WarmCard>
        </div>

        {/* Cart & Customer */}
        <div className="space-y-6">
           <WarmCard padding="lg" className="bg-white">
              <h3 className="font-bold text-[#2D2721] mb-4 flex items-center gap-2">
                 <User className="w-4 h-4" /> Klient
              </h3>
              <div className="space-y-3">
                 <input 
                    value={customer.name}
                    onChange={(e) => setCustomer({...customer, name: e.target.value})}
                    placeholder="Kliendi nimi"
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] border border-[#E7DCC7] text-sm"
                 />
                 <input 
                    value={customer.email}
                    onChange={(e) => setCustomer({...customer, email: e.target.value})}
                    placeholder="E-mail"
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] border border-[#E7DCC7] text-sm"
                 />
              </div>
           </WarmCard>

           <WarmCard padding="lg" className="bg-white">
              <h3 className="font-bold text-[#2D2721] mb-4">Ostukorv</h3>
              {cart.length === 0 ? (
                 <div className="text-center text-[#8B7355] py-8 text-sm">Ostukorv on tÃ¼hi</div>
              ) : (
                 <div className="space-y-3">
                    {cart.map((item) => (
                       <div key={item.id} className="flex justify-between items-center text-sm">
                          <div>
                             <div className="font-bold text-[#2D2721]">{item.quantity}x {item.name}</div>
                             <div className="text-xs text-[#8B7355]">{(item.price * item.quantity).toFixed(2)}â‚¬</div>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    ))}
                    <div className="pt-3 border-t border-[#E7DCC7] flex justify-between font-bold text-lg text-[#2D2721]">
                       <span>Kokku</span>
                       <span>{total.toFixed(2)}â‚¬</span>
                    </div>
                 </div>
              )}
           </WarmCard>
        </div>
      </div>
    </div>
  );
}
