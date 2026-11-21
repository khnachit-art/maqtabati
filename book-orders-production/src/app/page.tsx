import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <h2 className="text-3xl font-bold text-indigo-700">Gestion des commandes scolaires</h2>
      <p className="text-gray-600 max-w-lg text-center">
        Systeme complet de gestion et d'agregation des commandes de livres scolaires pour plusieurs etablissements.
      </p>
      <div className="flex gap-4">
        <Link
          href="/catalog"
          className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Catalogue
        </Link>
        <Link
          href="/orders"
          className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition-colors"
        >
          Commandes
        </Link>
        <Link
          href="/summary"
          className="bg-amber-600 text-white px-6 py-2 rounded hover:bg-amber-700 transition-colors"
        >
          Rapport
        </Link>
      </div>
    </div>
  );
}
