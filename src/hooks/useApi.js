import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing API calls with loading/error states
 * Usage: const { data, loading, error, execute } = useApi(apiFunction)
 */
export const useApi = (apiFunction) => {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args) => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await apiFunction(...args);
        setState({ data: result.data, loading: false, error: null });
        return result.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        setState({ data: null, loading: false, error: errorMessage });
        toast.error(errorMessage);
        throw err;
      }
    },
    [apiFunction]
  );

  return { ...state, execute };
};

/**
 * Custom hook for form validation
 */
export const useFormValidation = (initialValues, validate, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate(values);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        await onSubmit(values);
      } finally {
        setLoading(false);
      }
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    loading,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
  };
};

/**
 * Custom hook for local storage
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

/**
 * Custom hook for debounced values
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

export default { useApi, useFormValidation, useLocalStorage, useDebounce };
