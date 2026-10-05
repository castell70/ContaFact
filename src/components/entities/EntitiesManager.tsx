import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Truck, 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase,
  History,
  FileSpreadsheet
} from 'lucide-react';
import { AppState, Client, Supplier } from '../../types';
import { addClient, updateClient, deleteClient, addSupplier, updateSupplier, deleteSupplier, generateTemplateXlsx } from '../../services/dataStore';
import { formatCurrency } from '../../utils/numberToWords';

interface EntitiesManagerProps {
  type: 'clients' | 'suppliers';
  state: AppState;
  onOpenSaleForClient?: (client: Client) => void;
}

export const EntitiesManager: React.FC<EntitiesManagerProps> = ({
  type,
  state
}) => {
  const isClient = type === 'clients';
  const entityTitle = isClient ? 'Clientes' : 'Proveedores';
  const singularTitle = isClient ? 'Cliente' : 'Proveedor';

  const list = isClient ? state.clients : state.suppliers;

  // Form states
  const [name, setName] = useState('');
  const [nrc, setNrc] = useState('');
  const [nit, setNit] = useState('');
  const [dui, setDui] = useState('');
  const [address, setAddress] = useState('');
  const [activity, setActivity] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isGranContribuyente, setIsGranContribuyente] = useState(false);
  const [notes, setNotes] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);

  const showNotificationMsg = (message: string, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 5000);
  };

  const resetForm = () => {
    setName('');
    setNrc('');
    setNit('');
    setDui('');
    setAddress('');
    setActivity('');
    setContact('');
    setPhone('');
    setEmail('');
    setIsGranContribuyente(false);
    setNotes('');
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!name.trim()) {
        throw new Error('El nombre o razón social es obligatorio.');
      }
      if (!nit.trim()) {
        throw new Error('El NIT es obligatorio.');
      }

      if (editingId) {
        if (isClient) {
          updateClient(editingId, {
            name: name.trim(),
            nrc: nrc.trim(),
            nit: nit.trim(),
            dui: dui.trim(),
            address: address.trim(),
            activity: activity.trim(),
            contact: contact.trim(),
            phone: phone.trim(),
            email: email.trim(),
            isGranContribuyente,
            notes: notes.trim()
          });
        } else {
          updateSupplier(editingId, {
            name: name.trim(),
            nrc: nrc.trim(),
            nit: nit.trim(),
            dui: dui.trim(),
            address: address.trim(),
            activity: activity.trim(),
            contact: contact.trim(),
            phone: phone.trim(),
            email: email.trim(),
            isGranContribuyente,
            notes: notes.trim()
          });
        }
        showNotificationMsg(`${singularTitle} actualizado exitosamente.`);
      } else {
        if (isClient) {
          addClient({
            name: name.trim(),
            nrc: nrc.trim(),
            nit: nit.trim(),
            dui: dui.trim(),
            address: address.trim(),
            activity: activity.trim(),
            contact: contact.trim(),
            phone: phone.trim(),
            email: email.trim(),
            isGranContribuyente,
            notes: notes.trim()
          });
        } else {
          addSupplier({
            name: name.trim(),
            nrc: nrc.trim(),
            nit: nit.trim(),
            dui: dui.trim(),
            address: address.trim(),
            activity: activity.trim(),
            contact: contact.trim(),
            phone: phone.trim(),
            email: email.trim(),
            isGranContribuyente,
            notes: notes.trim()
          });
        }
        showNotificationMsg(`${singularTitle} registrado exitosamente.`);
      }

      resetForm();
    } catch (err: any) {
      showNotificationMsg(err.message || 'Error al guardar.', true);
    }
  };

  const handleStartEdit = (entity: Client | Supplier) => {
    setEditingId(entity.id);
    setName(entity.name);
    setNrc(entity.nrc || '');
    setNit(entity.nit || '');
    setDui(entity.dui || '');
    setAddress(entity.address || '');
    setActivity(entity.activity || '');
    setContact(entity.contact || '');
    setPhone(entity.phone || '');
    setEmail(entity.email || '');
    setIsGranContribuyente(!!entity.isGranContribuyente);
    setNotes(entity.notes || '');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmId) return;
    if (isClient) {
      deleteClient(deleteConfirmId);
    } else {
      deleteSupplier(deleteConfirmId);
    }
    showNotificationMsg(`${singularTitle} eliminado.`);
    setDeleteConfirmId(null);
  };

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchNrc = (item.nrc || '').toLowerCase().includes(q);
      const matchNit = (item.nit || '').toLowerCase().includes(q);
      const matchAct = (item.activity || '').toLowerCase().includes(q);
      const matchContact = (item.contact || '').toLowerCase().includes(q);
      return matchName || matchNrc || matchNit || matchAct || matchContact;
    });
  }, [list, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center justify-between shadow-lg border text-sm font-semibold transition-all ${
          notification.isError
            ? 'bg-red-50 text-red-800 border-red-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.isError ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-slate-900">Confirmar Eliminación</h3>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              ¿Está seguro de eliminar este {singularTitle.toLowerCase()}? Los comprobantes históricos asociados mantendrán sus datos para preservar los libros contables.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Eliminar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="px-6 py-4 bg-[#0f172a] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              {isClient ? <Users className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-bold text-base">
                {editingId ? `Modificando ${singularTitle}` : `Registrar Nuevo ${singularTitle}`}
              </h2>
              <p className="text-xs text-slate-400">
                Información tributaria y de contacto para emisión y recepción de comprobantes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editingId && (
              <button
                onClick={resetForm}
                className="px-3 py-1 text-xs font-semibold rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancelar Edición
              </button>
            )}
            <button
              type="button"
              onClick={() => generateTemplateXlsx(isClient ? 'clients' : 'suppliers')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-indigo-300 text-xs font-semibold border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Plantilla Excel</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {editingId && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-amber-900 text-xs font-semibold shadow-xs animate-pulse">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Modo Edición:</strong> Modificando datos de {singularTitle}: <span className="font-semibold">{name || 'Sin nombre'}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg text-xs font-bold transition-colors"
              >
                Cancelar Edición
              </button>
            </div>
          )}
          
          {/* Row 1: Name, NRC, NIT */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nombre / Razón Social *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Distribuidora Central S.A. de C.V."
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                NRC (Registro Contribuyente)
              </label>
              <input
                type="text"
                value={nrc}
                onChange={(e) => setNrc(e.target.value)}
                placeholder="123456-7"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                NIT *
              </label>
              <input
                type="text"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                placeholder="0614-010190-101-1"
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Row 2: Address & Activity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Dirección Comercial
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, avenida, municipio, departamento..."
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Giro o Actividad Económica
              </label>
              <input
                type="text"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="Ej. Servicios de consultoría, ferretería, transporte..."
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Row 3: Contact, Phone, Email, Gran Contribuyente */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Persona de Contacto
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Nombre y cargo"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Teléfono
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="2200-0000"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@empresa.com"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 select-none">
                <input
                  type="checkbox"
                  checked={isGranContribuyente}
                  onChange={(e) => setIsGranContribuyente(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span>Gran Contribuyente (1% Ret.)</span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Limpiar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-bold text-xs shadow-md bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingId ? `Actualizar ${singularTitle}` : `Guardar ${singularTitle}`}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              Directorio de {entityTitle} ({filteredList.length})
            </h3>
            <p className="text-xs text-slate-500">
              Listado completo para consulta rápida y emisión de comprobantes.
            </p>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, NRC, NIT o giro..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Building className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No hay {entityTitle.toLowerCase()} que coincidan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0f172a] text-white font-semibold uppercase">
                <tr>
                  <th className="px-3 py-2.5">Nombre / Razón Social</th>
                  <th className="px-3 py-2.5">NRC</th>
                  <th className="px-3 py-2.5">NIT</th>
                  <th className="px-3 py-2.5">Giro / Actividad</th>
                  <th className="px-3 py-2.5">Contacto / Teléfono</th>
                  <th className="px-3 py-2.5">Correo</th>
                  <th className="px-3 py-2.5 text-center">Tipo</th>
                  <th className="px-3 py-2.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-slate-900 max-w-[220px] truncate" title={item.name}>
                      {item.name}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-700 font-semibold">
                      {item.nrc || <span className="text-slate-400 italic">Sin NRC</span>}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-600">
                      {item.nit}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 max-w-[180px] truncate" title={item.activity}>
                      {item.activity || 'Comercial'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      <p className="font-medium">{item.contact || 'Oficina'}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{item.phone}</p>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 max-w-[150px] truncate" title={item.email}>
                      {item.email || 'N/D'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {item.isGranContribuyente ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Gran Contribuyente
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          Mediano/Pequeño
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
