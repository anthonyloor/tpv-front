import { useApiFetch } from '../components/utils/useApiFetch';

export function useCartRuleCreator() {
  const apiFetch = useApiFetch();

  const createCartRuleWithResponse = async (
    { discountType, value },
    onDiscountApplied,
    onClose,
    resetDiscountValue,
    setErrorMessage
  ) => {
    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    const date_from = now.toISOString().split('T')[0] + ' 00:00:00';
    const date_to = oneYearLater.toISOString().split('T')[0] + ' 23:59:59';

    const employee = JSON.parse(localStorage.getItem('employee')) || {};
    const shop = JSON.parse(localStorage.getItem('shop')) || {};
    const client = JSON.parse(localStorage.getItem('selectedClient'));
    const employeeName = employee.employee_name || 'Empleado';
    const shopName = shop.name || 'Tienda';
    const description = `Descuento generado por ${employeeName} en ${shopName}`;
    const name =
      discountType === 'percentage'
        ? `Descuento de ${value}%`
        : `Descuento de ${value}€`;
    const reduction_percent = discountType === 'percentage' ? value : 0;
    const reduction_amount = discountType === 'amount' ? value : 0;

    const discountData = {
      name,
      date_from,
      date_to,
      description,
      id_customer: client ? client.id_customer : null,
      reduction_percent,
      reduction_amount,
    };

    try {
      const result = await apiFetch('https://apitpv.anthonyloor.com/create_cart_rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discountData),
      });

      if (result) {
        const discObj = {
          name: name || '',
          description: description || '',
          code: result.code || '',
          reduction_amount: result.reduction_amount || 0,
          reduction_percent: result.reduction_percent || 0,
        };
        if (onDiscountApplied) onDiscountApplied(discObj);
        if (resetDiscountValue) resetDiscountValue('');
        if (setErrorMessage) setErrorMessage('');
        if (onClose) onClose();
        return result;  // Devolvemos el resultado exitoso
      } else {
        if (setErrorMessage) setErrorMessage(result.message || 'Error al crear el descuento.');
        return null;
      }
    } catch (error) {
      console.error('Error al enviar descuento:', error);
      if (setErrorMessage) setErrorMessage('Error al enviar el descuento.');
      return null;
    }
  };

  return { createCartRuleWithResponse };
}