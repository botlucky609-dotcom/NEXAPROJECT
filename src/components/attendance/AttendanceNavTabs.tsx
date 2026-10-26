import React from 'react';
import { 
  FileSpreadsheet, 
  Clock, 
  Moon, 
  Calculator, 
  Ship, 
  Table, 
  DollarSign 
} from 'lucide-react';
import { AppView } from '../../types/navigation';
import { useTheme } from '../../context/ThemeContext';

interface AttendanceNavTabsProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export const AttendanceNavTabs: React.FC<AttendanceNavTabsProps> = ({ currentView, onNavigate }) => {
  const { language } = useTheme();

  const tabs: { view: AppView; labelId: string; labelEn: string; icon: React.ReactNode }[] = [
    {
      view: 'attendance-timesheet',
      labelId: 'Form Time Sheet',
      labelEn: 'Time Sheet Form',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      view: 'attendance-overtime',
      labelId: 'Form Over time',
      labelEn: 'Overtime Form',
      icon: <Clock className="w-4 h-4 text-amber-500" />,
    },
    {
      view: 'attendance-nightshift',
      labelId: 'Form Night Shift',
      labelEn: 'Night Shift Form',
      icon: <Moon className="w-4 h-4 text-indigo-500" />,
    },
    {
      view: 'attendance-time-calc',
      labelId: 'Kalkulasi Waktu',
      labelEn: 'Time Calculation',
      icon: <Calculator className="w-4 h-4 text-emerald-500" />,
    },
    {
      view: 'attendance-project-calc',
      labelId: 'Kalkulasi Proyek',
      labelEn: 'Project Calculation',
      icon: <Ship className="w-4 h-4 text-teal-500" />,
    },
    {
      view: 'attendance-summary',
      labelId: 'Summary',
      labelEn: 'Monthly Summary',
      icon: <Table className="w-4 h-4 text-sky-500" />,
    },
    {
      view: 'attendance-labor-cost',
      labelId: 'Biaya Pekerja',
      labelEn: 'Worker Costs',
      icon: <DollarSign className="w-4 h-4 text-rose-500" />,
    },
  ];

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-xs overflow-x-auto">
      <div className="flex items-center gap-1 min-w-max">
        {tabs.map((tab) => {
          const isActive = currentView === tab.view;
          return (
            <button
              key={tab.view}
              onClick={() => onNavigate(tab.view)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{language === 'en' ? tab.labelEn : tab.labelId}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
