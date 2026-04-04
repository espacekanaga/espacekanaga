import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { workScheduleApi, type WorkSchedule } from '../../api/workSchedule';
import { ScissorsIcon, ClockIcon, MapPinIcon, PhoneIcon, ArrowLeftIcon } from './clientShared';

export function ClientAtelierPage() {
  const [schedule, setSchedule] = useState<WorkSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    try {
      const data = await workScheduleApi.getPublic();
      setSchedule(data);
    } catch {
      // Silently handle error
    } finally {
      setIsLoading(false);
    }
  }

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
  const todaySchedule = schedule.find(s => 
    s.day.toLowerCase() === today.toLowerCase()
  );
  const isOpen = todaySchedule?.enabled ?? true;

  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const orderedSchedule = weekDays.map(day => 
    schedule.find(s => s.day === day)
  ).filter((s): s is WorkSchedule => Boolean(s));

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 px-4 sm:px-6 lg:px-8 py-4 md:py-6">
      {/* Header avec bouton retour - responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <Link to="/client/dashboard" className="self-start">
          <Button variant="secondary" size="sm" className="w-full sm:w-auto">
            <ArrowLeftIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">Retour</span>
          </Button>
        </Link>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
          Espace Atelier
        </h1>
      </div>

      {/* Status Card - full width responsive */}
      <Card className={`overflow-hidden transition-all duration-300 ${isOpen ? 'border-purple-500/40 bg-gradient-to-br from-purple-50/80 to-fuchsia-50/50 dark:from-purple-900/20 dark:to-fuchsia-900/10 shadow-purple-100 dark:shadow-purple-900/20' : 'border-red-500/40 bg-gradient-to-br from-red-50/80 to-rose-50/50 dark:from-red-900/20 dark:to-rose-900/10 shadow-red-100 dark:shadow-red-900/20'} shadow-lg`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${isOpen ? 'bg-purple-100 dark:bg-purple-900/40 shadow-purple-200' : 'bg-red-100 dark:bg-red-900/40 shadow-red-200'} shadow-lg`}>
                <ScissorsIcon className={`w-7 h-7 sm:w-8 sm:h-8 ${isOpen ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Atelier de Couture
                </h2>
                <Badge variant={isOpen ? 'success' : 'danger'} className="mt-1 text-xs sm:text-sm">
                  {isOpen ? 'Ouvert aujourd\'hui' : 'Ferme aujourd\'hui'}
                </Badge>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Aujourd'hui</p>
              <p className="font-medium text-slate-900 dark:text-slate-100 capitalize text-base sm:text-lg">{today}</p>
              {todaySchedule?.enabled && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {todaySchedule.openTime} - {todaySchedule.closeTime}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Présentation - 2 colonnes sur desktop, 1 sur mobile */}
      <Card className="overflow-hidden">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">A propos de notre atelier</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Notre atelier de couture met son savoir-faire a votre service pour la creation 
            de vetements sur mesure, les retouches et les reparations. Nos tailleurs 
            experimentes vous garantissent une finition impeccable.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-start gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                <ScissorsIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">Couture sur mesure</p>
                <p className="text-xs sm:text-sm text-slate-500">Traditionnel & moderne</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                <MapPinIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">Retrait sur place</p>
                <p className="text-xs sm:text-sm text-slate-500">Apres essayage</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center flex-shrink-0">
                <ScissorsIcon className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">Retouches express</p>
                <p className="text-xs sm:text-sm text-slate-500">Reparations rapides</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">Essayage sur RDV</p>
                <p className="text-xs sm:text-sm text-slate-500">Conseils personnalises</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horaires - table responsive */}
      <Card className="overflow-hidden">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ClockIcon className="w-5 h-5 text-slate-500" />
            Horaires d'ouverture
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-12 sm:h-14 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              {orderedSchedule.map((day) => (
                <div
                  key={day?.day}
                  className={`flex items-center justify-between p-3 sm:p-4 rounded-xl transition-all ${
                    day?.day.toLowerCase() === today.toLowerCase()
                      ? 'bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    {day?.day.toLowerCase() === today.toLowerCase() && (
                      <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></span>
                    )}
                    <span className={`font-medium text-sm sm:text-base ${
                      day?.day.toLowerCase() === today.toLowerCase()
                        ? 'text-purple-900 dark:text-purple-100'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {day?.day}
                    </span>
                  </div>
                  <span className={`text-sm sm:text-base font-medium ${
                    day?.enabled 
                      ? day?.day.toLowerCase() === today.toLowerCase()
                        ? 'text-purple-700 dark:text-purple-300'
                        : 'text-slate-600 dark:text-slate-400'
                      : 'text-slate-400 dark:text-slate-600 italic'
                  }`}>
                    {day?.enabled ? `${day.openTime} - ${day.closeTime}` : 'Ferme'}
                  </span>
                </div>
              ))}
              {!schedule.length && (
                <div className="text-center py-8 sm:py-12 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <ClockIcon className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm sm:text-base">Horaires non disponibles</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact - 2 colonnes sur desktop */}
      <Card className="overflow-hidden">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">Contact</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                <PhoneIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-slate-500">Telephone</p>
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">+223 XX XX XX XX</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <MapPinIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-slate-500">Adresse</p>
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">Espace Kanaga, Bamako</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
