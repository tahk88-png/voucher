import { WarmCard } from '@app/components/WarmCard';
import { GlobalNavigation } from '@app/components/GlobalNavigation';
import { ScrollText, ShieldCheck, Scale, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@app/components/SEOHead';
import { WarmButton } from '@app/components/WarmButton';

export function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SEOHead title="Kasutajatingimused | GiftHub" description="Tutvu meie kasutajatingimuste ja privaatsuspoliitikaga." />
      <GlobalNavigation />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-[#8B7355] hover:text-[#2D2721] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tagasi
          </button>
          <h1 className="text-4xl font-display font-bold text-[#2D2721] mb-4">Kasutajatingimused</h1>
          <p className="text-[#6B5744]">Viimati uuendatud: 25. jaanuar 2026</p>
        </div>

        <div className="grid gap-8">
          {/* Introduction Card */}
          <WarmCard padding="lg" className="border-l-4 border-l-[#E17B5C]">
            <div className="flex gap-4">
              <div className="p-3 bg-[#E17B5C]/10 rounded-xl h-fit">
                <Scale className="w-6 h-6 text-[#E17B5C]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#2D2721] mb-2">Üldtingimused</h2>
                <p className="text-[#6B5744] leading-relaxed">
                  Tere tulemast GiftHub platvormile. Meie teenuseid kasutades nõustute järgnevate tingimustega. 
                  Oleme pühendunud läbipaistvusele ja ausale äritegevusele. Palun lugege need tingimused hoolikalt läbi.
                </p>
              </div>
            </div>
          </WarmCard>

          {/* Detailed Sections */}
          <div className="bg-white rounded-3xl p-8 border border-[#E7DCC7] space-y-8 shadow-sm">
            
            <section>
              <h3 className="text-xl font-bold text-[#2D2721] mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-sm border border-[#E7DCC7]">1</span>
                Teenuse olemus
              </h3>
              <p className="text-[#6B5744] pl-10 leading-relaxed">
                GiftHub on vahendusplatvorm, mis ühendab kaupmehi (Teenusepakkujad) ja kliente (Kasutajad). 
                Meie roll on pakkuda tehnilist lahendust broneeringute, maksete ja renditehingute haldamiseks.
                Tegelik müügileping sõlmitakse Kasutaja ja Kaupmehe vahel.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-[#2D2721] mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-sm border border-[#E7DCC7]">2</span>
                Renditingimused ja Vastutus
              </h3>
              <div className="pl-10 space-y-3 text-[#6B5744]">
                <p>
                  Rentides seadmeid või tooteid, kohustub Kasutaja tagastama need samas seisukorras (v.a. loomulik kulumine).
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Hilinenud tagastuse korral on Kaupmehel õigus nõuda viivist vastavalt hinnakirjale.</li>
                  <li>Seadme purunemisel või kadumisel vastutab Kasutaja toote turuväärtuse ulatuses, kui pole sõlmitud kindlustust.</li>
                  <li>Isikutuvastus on nõutud kõikide renditehingute puhul pettuste vältimiseks.</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-[#2D2721] mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-sm border border-[#E7DCC7]">3</span>
                Privaatsus ja Andmekaitse
              </h3>
              <div className="pl-10 flex gap-4 items-start bg-[#FAF7F2] p-4 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-[#00D098] flex-shrink-0 mt-0.5" />
                <p className="text-[#6B5744] text-sm">
                  Kaitseme teie andmeid vastavalt GDPR nõuetele. Me ei jaga teie isikuandmeid kolmandate osapooltega, 
                  välja arvatud teenuse osutamiseks vajalikus mahus (nt makseteenuse pakkujad, logistikapartnerid).
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-[#2D2721] mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-sm border border-[#E7DCC7]">4</span>
                Taganemisõigus
              </h3>
              <p className="text-[#6B5744] pl-10 leading-relaxed">
                Tarbijast kliendil on õigus tehingust taganeda 14 päeva jooksul. See õigus ei laiene teenustele, 
                mida on juba osutama hakatud (nt alanud rendiperiood) või kiiresti riknevatele kaupadele.
              </p>
            </section>

          </div>

          <div className="flex justify-center pt-8">
             <p className="text-center text-[#8B7355] text-sm max-w-lg">
               Küsimuste korral võtke ühendust meie klienditoega aadressil <a href="mailto:support@gifthub.ee" className="text-[#E17B5C] font-bold hover:underline">support@gifthub.ee</a>
             </p>
          </div>
        </div>
      </main>
    </div>
  );
}