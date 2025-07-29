import { Squares2X2Icon } from '@heroicons/react/24/outline';

const CategoryManager = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Category Manager</h1>
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="text-center py-12">
          <Squares2X2Icon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">Category Manager</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Feature coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;