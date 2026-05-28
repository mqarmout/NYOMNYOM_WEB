import { createContext, useContext, useState, useCallback, useRef } from "react";
import { apiFetch } from "../utils";

const JobContext = createContext(null);

export function JobProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2500);
  }, []);

  const loadJobs = useCallback(async () => {
    setJobs(await apiFetch("/api/jobs"));
  }, []);

  const loadContacts = useCallback(async () => {
    setContacts(await apiFetch("/api/contacts"));
  }, []);

  const loadAll = useCallback(async () => {
    const [j, c] = await Promise.all([apiFetch("/api/jobs"), apiFetch("/api/contacts")]);
    if (!j.error) setJobs(j);
    if (!c.error) setContacts(c);
  }, []);

  const addJob = useCallback(
    async (data) => {
      await apiFetch("/api/jobs", { method: "POST", body: JSON.stringify(data) });
      setJobs(await apiFetch("/api/jobs"));
      showToast("Application added ✓");
    },
    [showToast]
  );

  const updateJob = useCallback(
    async (id, data) => {
      await apiFetch("/api/jobs/" + id, { method: "PUT", body: JSON.stringify(data) });
      setJobs(await apiFetch("/api/jobs"));
      showToast("Updated ✓");
    },
    [showToast]
  );

  const deleteJob = useCallback(
    async (id) => {
      await apiFetch("/api/jobs/" + id, { method: "DELETE" });
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setContacts((prev) => prev.filter((c) => c.job_id !== id));
      showToast("Deleted");
    },
    [showToast]
  );

  const addContact = useCallback(
    async (jobId, data) => {
      await apiFetch("/api/jobs/" + jobId + "/contacts", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setContacts(await apiFetch("/api/contacts"));
      showToast("Contact added ✓");
    },
    [showToast]
  );

  const updateContact = useCallback(
    async (id, data) => {
      await apiFetch("/api/contacts/" + id, { method: "PUT", body: JSON.stringify(data) });
      setContacts(await apiFetch("/api/contacts"));
      showToast("Contact updated ✓");
    },
    [showToast]
  );

  const deleteContact = useCallback(
    async (id) => {
      await apiFetch("/api/contacts/" + id, { method: "DELETE" });
      setContacts((prev) => prev.filter((c) => c.id !== id));
      showToast("Deleted");
    },
    [showToast]
  );

  return (
    <JobContext.Provider
      value={{
        jobs,
        contacts,
        toast,
        loadAll,
        loadJobs,
        loadContacts,
        addJob,
        updateJob,
        deleteJob,
        addContact,
        updateContact,
        deleteContact,
        showToast,
      }}
    >
      {children}
    </JobContext.Provider>
  );
}

export const useJob = () => useContext(JobContext);
