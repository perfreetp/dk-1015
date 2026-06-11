import { useState, useEffect } from 'react';
import { mockEndoscopes, mockPatients, mockCleaningBatches, mockEquipment, mockQCSamples, mockAlerts, type Endoscope, type Patient, type CleaningBatch, type Equipment, type QCSample, type Alert } from '../data/mockData';
const STORAGE_KEYS = {
 ENDOSCOPES: 'endoscope_tracking_endoscopes',
 PATIENTS: 'endoscope_tracking_patients',
 BATCHES: 'endoscope_tracking_batches',
 EQUIPMENT: 'endoscope_tracking_equipment',
 QCSAMPLES: 'endoscope_tracking_qcsamples',
 ALERTS: 'endoscope_tracking_alerts',
};
export interface StoreState {
 endoscopes: Endoscope[];
 patients: Patient[];
 batches: CleaningBatch[];
 equipment: Equipment[];
 qcSamples: QCSample[];
 alerts: Alert[];
}
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
 try {
 const stored = localStorage.getItem(key);
 return stored ? JSON.parse(stored) : defaultValue;
 }
 catch {
 return defaultValue;
 }
};
const saveToStorage = <T>(key: string, value: T): void => {
 localStorage.setItem(key, JSON.stringify(value));
};
export const useStore = () => {
 const [endoscopes, setEndoscopes] = useState<Endoscope[]>(() => loadFromStorage(STORAGE_KEYS.ENDOSCOPES, mockEndoscopes));
 const [patients, setPatients] = useState<Patient[]>(() => loadFromStorage(STORAGE_KEYS.PATIENTS, mockPatients));
 const [batches, setBatches] = useState<CleaningBatch[]>(() => loadFromStorage(STORAGE_KEYS.BATCHES, mockCleaningBatches));
 const [equipment, setEquipment] = useState<Equipment[]>(() => loadFromStorage(STORAGE_KEYS.EQUIPMENT, mockEquipment));
 const [qcSamples, setQCSamples] = useState<QCSample[]>(() => loadFromStorage(STORAGE_KEYS.QCSAMPLES, mockQCSamples));
 const [alerts, setAlerts] = useState<Alert[]>(() => loadFromStorage(STORAGE_KEYS.ALERTS, mockAlerts));
 useEffect(() => {
 saveToStorage(STORAGE_KEYS.ENDOSCOPES, endoscopes);
 }, [endoscopes]);
 useEffect(() => {
 saveToStorage(STORAGE_KEYS.PATIENTS, patients);
 }, [patients]);
 useEffect(() => {
 saveToStorage(STORAGE_KEYS.BATCHES, batches);
 }, [batches]);
 useEffect(() => {
 saveToStorage(STORAGE_KEYS.EQUIPMENT, equipment);
 }, [equipment]);
 useEffect(() => {
 saveToStorage(STORAGE_KEYS.QCSAMPLES, qcSamples);
 }, [qcSamples]);
 useEffect(() => {
 saveToStorage(STORAGE_KEYS.ALERTS, alerts);
 }, [alerts]);
 const updateEndoscopeStatus = (id: number, status: Endoscope['status']) => {
 setEndoscopes(prev => prev.map(e => e.id === id ? { ...e, status } : e));
 };
 const addEndoscope = (endoscope: Omit<Endoscope, 'id'>) => {
 const newEndoscope: Endoscope = {
 ...endoscope,
 id: Date.now(),
 };
 setEndoscopes(prev => [...prev, newEndoscope]);
 };
 const updateEndoscope = (id: number, updates: Partial<Endoscope>) => {
 setEndoscopes(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
 };
 const deleteEndoscope = (id: number) => {
 setEndoscopes(prev => prev.filter(e => e.id !== id));
 };
 const addPatient = (patient: Omit<Patient, 'id'>) => {
 const newPatient: Patient = {
 ...patient,
 id: Date.now(),
 };
 setPatients(prev => [...prev, newPatient]);
 };
 const updatePatient = (id: number, updates: Partial<Patient>) => {
 setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
 };
 const addBatch = (batch: Omit<CleaningBatch, 'id' | 'createdAt'>) => {
 const now = new Date();
 const newBatch: CleaningBatch = {
 ...batch,
 id: Date.now(),
 createdAt: now.toISOString(),
 };
 setBatches(prev => [...prev, newBatch]);
 return newBatch;
 };
 const updateBatch = (id: number, updates: Partial<CleaningBatch>) => {
 setBatches(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
 };
 const bindPatientToBatch = (batchId: number, patientId: number, patientName: string) => {
 setBatches(prev => prev.map(b => b.id === batchId ? { ...b, patientId, patientName } : b));
 };
 const updateEquipmentStatus = (id: number, status: Equipment['status']) => {
 setEquipment(prev => prev.map(e => e.id === id ? { ...e, status } : e));
 };
 const addEquipment = (equip: Omit<Equipment, 'id'>) => {
 const newEquip: Equipment = {
 ...equip,
 id: Date.now(),
 };
 setEquipment(prev => [...prev, newEquip]);
 };
 const updateEquipment = (id: number, updates: Partial<Equipment>) => {
 setEquipment(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
 };
 const addQCSample = (sample: Omit<QCSample, 'id'>) => {
 const newSample: QCSample = {
 ...sample,
 id: Date.now(),
 };
 setQCSamples(prev => [...prev, newSample]);
 };
 const updateQCSample = (id: number, updates: Partial<QCSample>) => {
 setQCSamples(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
 };
 const addAlert = (alert: Omit<Alert, 'id'>) => {
 const newAlert: Alert = {
 ...alert,
 id: Date.now(),
 };
 setAlerts(prev => [...prev, newAlert]);
 };
 const removeAlert = (id: number) => {
 setAlerts(prev => prev.filter(a => a.id !== id));
 };
 return {
 endoscopes,
 patients,
 batches,
 equipment,
 qcSamples,
 alerts,
 updateEndoscopeStatus,
 addEndoscope,
 updateEndoscope,
 deleteEndoscope,
 addPatient,
 updatePatient,
 addBatch,
 updateBatch,
 bindPatientToBatch,
 updateEquipmentStatus,
 addEquipment,
 updateEquipment,
 addQCSample,
 updateQCSample,
 addAlert,
 removeAlert,
 };
};

