'use client';

import { useState, useEffect } from 'react';
import { Users, Wifi, Clock, Gift, Settings, Mail, Award, TrendingUp, Lock, Plus, Edit, Trash2, Calendar, Shield, Eye } from 'lucide-react';

interface Stats {
  totalUsers: number;
  connectionsToday: number;
  avgDuration: number;
  activeConnections: number;
  birthdaysThisMonth: number;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    connectionsToday: 0,
    avgDuration: 0,
    activeConnections: 0,
    birthdaysThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [lotteryLot, setLotteryLot] = useState('Café croissant offert');
  const [lotteryResult, setLotteryResult] = useState<any>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [messageForm, setMessageForm] = useState({
    titre: '',
    message_fr: '',
    date_debut: '',
    date_fin: '',
    actif: true
  });

  const [rgpdContent, setRgpdContent] = useState('');
  const [tempRgpdContent, setTempRgpdContent] = useState('');

  const [configLoading, setConfigLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [rgpdEmail, setRgpdEmail] = useState('');
  const [configMessage, setConfigMessage] = useState('');

  const [wifiHours, setWifiHours] = useState({
    openHour: 6,
    closeHour: 20,
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchMessages();
      fetchRGPD();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'horaires') {
      fetchWifiHours();
    }
  }, [activeTab, isAuthenticated]);

  const fetchWifiHours = async () => {
    try {
      const response = await fetch('/api/wifi-hours');
      if (response.ok) {
        const data = await response.json();
        setWifiHours(data);
      }
    } catch (error) {
      console.error('Error fetching wifi hours:', error);
    }
  };

  const handleSaveWifiHours = async () => {
    try {
      const response = await fetch('/api/wifi-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wifiHours)
      });

      if (response.ok) {
        alert('Horaires sauvegardés avec succès !');
        fetchWifiHours();
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      alert('Erreur serveur');
    }
  };

  const checkAuth = () => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin_token', data.token);
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || 'Identifiant ou mot de passe incorrect');
      }
    } catch (error) {
      setLoginError('Erreur de connexion au serveur');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setLoginData({ email: '', password: '' });
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages/translate');
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchRGPD = async () => {
    try {
      const response = await fetch('/api/rgpd');
      if (response.ok) {
        const data = await response.json();
        setRgpdContent(data.content);
        setTempRgpdContent(data.content);
      }
    } catch (error) {
      console.error('Error fetching RGPD:', error);
    }
  };

  const fetchConfigs = async () => {
    setConfigLoading(true);
    try {
      const [redirectRes, rgpdRes] = await Promise.all([
        fetch('/api/admin/config?key=redirect_url'),
        fetch('/api/admin/config?key=rgpd_email')
      ]);

      const redirectData = await redirectRes.json();
      const rgpdData = await rgpdRes.json();

      if (redirectData.valeur) setRedirectUrl(redirectData.valeur);
      if (rgpdData.valeur) setRgpdEmail(rgpdData.valeur);
    } catch (error) {
      console.error('Erreur récupération configs:', error);
      setConfigMessage('Erreur lors du chargement');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleSaveConfigs = async () => {
    setConfigLoading(true);
    setConfigMessage('');

    try {
      const responses = await Promise.all([
        fetch('/api/admin/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'redirect_url', valeur: redirectUrl })
        }),
        fetch('/api/admin/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'rgpd_email', valeur: rgpdEmail })
        })
      ]);

      if (responses.every(r => r.ok)) {
        setConfigMessage('Configuration mise à jour avec succès ✓');
      } else {
        setConfigMessage('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      setConfigMessage('Erreur serveur');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleSaveMessage = async () => {
    try {
      const method = editingMessage ? 'PUT' : 'POST';
      const body = editingMessage ? { ...messageForm, id: editingMessage.id } : messageForm;

      const response = await fetch('/api/messages/translate', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        fetchMessages();
        setShowMessageForm(false);
        setEditingMessage(null);
        setMessageForm({ titre: '', message_fr: '', date_debut: '', date_fin: '', actif: true });
        alert('Message enregistré !');
      }
    } catch (error) {
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Supprimer ce message ?')) return;
    
    try {
      const response = await fetch('/api/messages/translate', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        fetchMessages();
        alert('Message supprimé');
      }
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleEditMessage = (msg: any) => {
    setEditingMessage(msg);
    setMessageForm({
      titre: msg.titre,
      message_fr: msg.message_fr,
      date_debut: msg.date_debut?.split('T')[0] || '',
      date_fin: msg.date_fin?.split('T')[0] || '',
      actif: msg.actif
    });
    setShowMessageForm(true);
  };

  const handleSaveRGPD = async () => {
    try {
      const response = await fetch('/api/rgpd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: tempRgpdContent })
      });

      if (response.ok) {
        setRgpdContent(tempRgpdContent);
        alert('Politique RGPD sauvegardée !');
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    }
  };

  const executeLottery = async () => {
    if (!confirm('Lancer le tirage au sort ?')) return;

    try {
      const response = await fetch('/api/lottery/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lot: lotteryLot })
      });

      if (response.ok) {
        const data = await response.json();
        setLotteryResult(data);
        alert(`Gagnant: ${data.winner.prenom} (${data.winner.email})`);
      }
    } catch (error) {
      alert('Erreur lors du tirage');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border-2 border-amber-200">
          <div className="text-center mb-8">
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-700" />
            </div>
            <h1 className="text-3xl font-bold text-amber-900 mb-2">Administration</h1>
            <p className="text-amber-700">WiFi La Promenade</p>
          </div>

          {loginError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Login</label>
              <input
                type="text"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-gray-900"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700"
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'stats', icon: TrendingUp, label: 'Statistiques' },
    { id: 'messages', icon: Mail, label: 'Messages' },
    { id: 'rgpd', icon: Shield, label: 'RGPD' },
    { id: 'users', icon: Users, label: 'Utilisateurs' },
    { id: 'lottery', icon: Gift, label: 'Tirage au sort' },
    { id: 'horaires', icon: Clock, label: 'Horaires' },
    { id: 'config', icon: Settings, label: 'Configuration' }
  ];

  return (
    <div className="min-h-screen bg-amber-50">
      <nav className="bg-gradient-to-r from-amber-700 to-orange-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">🥐 Administration WiFi</h1>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              <Lock className="w-4 h-4 mr-2" />
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex space-x-4 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-lg whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Utilisateurs totaux</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                      {loading ? '...' : stats.totalUsers}
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-amber-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Connexions aujourd'hui</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                      {loading ? '...' : stats.connectionsToday}
                    </p>
                  </div>
                  <Wifi className="w-12 h-12 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Durée moyenne (min)</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                      {loading ? '...' : stats.avgDuration}
                    </p>
                  </div>
                  <Clock className="w-12 h-12 text-orange-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Connexions actives</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                      {loading ? '...' : stats.activeConnections}
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Infos rapides</h3>
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <Gift className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Anniversaires ce mois</p>
                  <p className="text-2xl font-bold">{stats.birthdaysThisMonth}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Messages personnalisés</h3>
              <button
                onClick={() => {
                  setShowMessageForm(true);
                  setEditingMessage(null);
                  setMessageForm({ titre: '', message_fr: '', date_debut: '', date_fin: '', actif: true });
                }}
                className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nouveau message
              </button>
            </div>

            {showMessageForm && (
              <div className="mb-6 p-6 bg-amber-50 rounded-lg border-2 border-amber-200">
                <h4 className="font-semibold mb-4">
                  {editingMessage ? 'Modifier le message' : 'Créer un message'}
                </h4>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={messageForm.titre}
                    onChange={(e) => setMessageForm({ ...messageForm, titre: e.target.value })}
                    placeholder="Titre"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                  />
                  <textarea
                    value={messageForm.message_fr}
                    onChange={(e) => setMessageForm({ ...messageForm, message_fr: e.target.value })}
                    placeholder="Message en français"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 h-32"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={messageForm.date_debut}
                      onChange={(e) => setMessageForm({ ...messageForm, date_debut: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <input
                      type="date"
                      value={messageForm.date_fin}
                      onChange={(e) => setMessageForm({ ...messageForm, date_fin: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={messageForm.actif}
                      onChange={(e) => setMessageForm({ ...messageForm, actif: e.target.checked })}
                      className="w-5 h-5 mr-3"
                    />
                    <label>Message actif</label>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleSaveMessage}
                      className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setShowMessageForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun message</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="border border-gray-200 rounded-lg p-4 hover:border-amber-300">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{msg.titre}</h4>
                        <p className="text-gray-600 mt-1">{msg.message_fr}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          {msg.date_debut && (
                            <span>Du {new Date(msg.date_debut).toLocaleDateString('fr-FR')}</span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            msg.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                          }`}>
                            {msg.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => handleEditMessage(msg)} className="p-2 text-blue-600 hover:bg-blue-50">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteMessage(msg.id)} className="p-2 text-red-600 hover:bg-red-50">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'rgpd' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Gestion de la politique RGPD</h2>
            <div className="space-y-4">
              <textarea
                value={tempRgpdContent}
                onChange={(e) => setTempRgpdContent(e.target.value)}
                rows={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-mono text-sm"
              />
              <div className="flex space-x-4">
                <button
                  onClick={handleSaveRGPD}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-amber-700"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => setTempRgpdContent(rgpdContent)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Gestion des utilisateurs</h3>
            <p className="text-gray-600">Fonctionnalité en développement</p>
          </div>
        )}

        {activeTab === 'lottery' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-6">
              <Award className="w-16 h-16 mx-auto text-amber-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Tirage au sort mensuel</h2>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <input
                type="text"
                value={lotteryLot}
                onChange={(e) => setLotteryLot(e.target.value)}
                placeholder="Lot à gagner"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
              />
              <button
                onClick={executeLottery}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold"
              >
                Lancer le tirage
              </button>

              {lotteryResult && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <h4 className="font-bold text-green-800 mb-2">Tirage effectué !</h4>
                  <p className="text-green-700"><strong>Gagnant:</strong> {lotteryResult.winner.prenom}</p>
                  <p className="text-green-700"><strong>Participants:</strong> {lotteryResult.participants}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'horaires' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Horaires d'ouverture du WiFi</h3>
            
            <div className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure d'ouverture
                  </label>
                  <select
                    value={wifiHours.openHour}
                    onChange={(e) => setWifiHours({ ...wifiHours, openHour: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{i}h</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure de fermeture
                  </label>
                  <select
                    value={wifiHours.closeHour}
                    onChange={(e) => setWifiHours({ ...wifiHours, closeHour: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{i}h</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Jours d'ouverture</h4>
                <div className="space-y-2">
                  {[
                    { key: 'monday', label: 'Lundi' },
                    { key: 'tuesday', label: 'Mardi' },
                    { key: 'wednesday', label: 'Mercredi' },
                    { key: 'thursday', label: 'Jeudi' },
                    { key: 'friday', label: 'Vendredi' },
                    { key: 'saturday', label: 'Samedi' },
                    { key: 'sunday', label: 'Dimanche' }
                  ].map(day => (
                    <label key={day.key} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wifiHours[day.key as keyof typeof wifiHours] as boolean}
                        onChange={(e) => setWifiHours({ 
                          ...wifiHours, 
                          [day.key]: e.target.checked 
                        })}
                        className="w-4 h-4 mr-3 accent-amber-600"
                      />
                      <span className="text-gray-700">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveWifiHours}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition shadow-lg"
              >
                Sauvegarder les horaires
              </button>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-6">Configuration système</h3>
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL de redirection</label>
                <input
                  type="url"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email RGPD</label>
                <input
                  type="email"
                  value={rgpdEmail}
                  onChange={(e) => setRgpdEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              <button
                onClick={handleSaveConfigs}
                disabled={configLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold"
              >
                {configLoading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              {configMessage && (
                <div className={`p-3 rounded ${
                  configMessage.includes('succès') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {configMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}