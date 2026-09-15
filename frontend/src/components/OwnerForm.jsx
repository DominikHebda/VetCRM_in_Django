/**
 * @typedef {Object} OwnerFormValues
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} email
 * @property {string} phone
 * @property {string} address
 */

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.description
 * @param {OwnerFormValues} [props.initialValues]
 * @param {'idle' | 'saving' | 'error'} props.status
 * @param {(values: OwnerFormValues) => Promise<void>} props.onSubmit
 * @param {() => void} props.onCancel
 */
function OwnerForm({
  title,
  description,
  initialValues,
  status,
  onSubmit,
  onCancel,
}) {
  /**
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  async function handleSubmit(event) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    await onSubmit({
      first_name: String(formData.get('first_name') ?? '').trim(),
      last_name: String(formData.get('last_name') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      address: String(formData.get('address') ?? '').trim(),
    })
  }

  return (
    <div className="owner-form-card">
      <div className="owner-form-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <button
          type="button"
          onClick={onCancel}
        >
          Anuluj
        </button>
      </div>

      <form
        className="owner-form"
        onSubmit={handleSubmit}
      >
        <label>
          Imię
          <input
            type="text"
            name="first_name"
            defaultValue={initialValues?.first_name ?? ''}
            required
          />
        </label>

        <label>
          Nazwisko
          <input
            type="text"
            name="last_name"
            defaultValue={initialValues?.last_name ?? ''}
            required
          />
        </label>

        <label>
          E-mail
          <input
            type="email"
            name="email"
            defaultValue={initialValues?.email ?? ''}
            required
          />
        </label>

        <label>
          Telefon
          <input
            type="tel"
            name="phone"
            defaultValue={initialValues?.phone ?? ''}
          />
        </label>

        <label className="owner-form-full-width">
          Adres
          <textarea
            name="address"
            rows={3}
            defaultValue={initialValues?.address ?? ''}
          />
        </label>

        {status === 'error' && (
          <p className="form-error">
            Nie udało się zapisać właściciela.
            Sprawdź dane i spróbuj ponownie.
          </p>
        )}

        <div className="owner-form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={status === 'saving'}
          >
            {status === 'saving'
              ? 'Zapisywanie...'
              : 'Zapisz właściciela'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default OwnerForm