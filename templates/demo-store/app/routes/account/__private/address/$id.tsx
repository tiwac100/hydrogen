import {json, redirect, type ActionFunction} from '@shopify/remix-oxygen';
import {
  Form,
  useActionData,
  useOutletContext,
  useParams,
  useTransition,
} from '@remix-run/react';
import {flattenConnection} from '@shopify/hydrogen-react';
import type {MailingAddressInput} from '@shopify/hydrogen-react/storefront-api-types';
import invariant from 'tiny-invariant';
import {Button, Text} from '~/components';
import {
  createCustomerAddress,
  deleteCustomerAddress,
  updateCustomerAddress,
  updateCustomerDefaultAddress,
} from '~/data';
import {getInputStyleClasses} from '~/lib/utils';
import type {AccountOutletContext} from '../edit';

interface ActionData {
  formError?: string;
}

const badRequest = (data: ActionData) => json(data, {status: 400});

export const handle = {
  renderInModal: true,
};

export const action: ActionFunction = async ({request, context, params}) => {
  const formData = await request.formData();

  const customerAccessToken = await context.session.get('customerAccessToken');
  invariant(customerAccessToken, 'You must be logged in to edit your account.');

  const addressId = formData.get('addressId');
  invariant(typeof addressId === 'string', 'You must provide an address id.');

  if (request.method === 'DELETE') {
    try {
      await deleteCustomerAddress(context, {
        customerAccessToken,
        addressId,
      });

      return redirect(params.lang ? `${params.lang}/account` : '/account');
    } catch (error: any) {
      return badRequest({formError: error.message});
    }
  }

  const address: MailingAddressInput = {};

  const keys: (keyof MailingAddressInput)[] = [
    'lastName',
    'firstName',
    'address1',
    'address2',
    'city',
    'province',
    'country',
    'zip',
    'phone',
    'company',
  ];

  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === 'string') {
      address[key] = value;
    }
  }

  const defaultAddress = formData.get('defaultAddress');

  if (addressId === 'add') {
    try {
      const id = await createCustomerAddress(context, {
        customerAccessToken,
        address,
      });

      if (defaultAddress) {
        await updateCustomerDefaultAddress(context, {
          customerAccessToken,
          addressId: id,
        });
      }

      return redirect(params.lang ? `${params.lang}/account` : '/account');
    } catch (error: any) {
      return badRequest({formError: error.message});
    }
  } else {
    try {
      await updateCustomerAddress(context, {
        customerAccessToken,
        addressId: decodeURIComponent(addressId),
        address,
      });

      if (defaultAddress) {
        await updateCustomerDefaultAddress(context, {
          customerAccessToken,
          addressId: decodeURIComponent(addressId),
        });
      }

      return redirect(params.lang ? `${params.lang}/account` : '/account');
    } catch (error: any) {
      return badRequest({formError: error.message});
    }
  }
};

export default function EditAddress() {
  const {addressId} = useParams();
  const isNewAddress = addressId === 'add';
  const actionData = useActionData<ActionData>();
  const transition = useTransition();
  const {customer} = useOutletContext<AccountOutletContext>();
  const addresses = flattenConnection(customer.addresses);
  const defaultAddress = customer.defaultAddress;
  /**
   * When a refresh happens (or a user visits this link directly), the URL
   * is actually stale because it contains a special token. This means the data
   * loaded by the parent and passed to the outlet contains a newer, fresher token,
   * and we don't find a match. We update the `find` logic to just perform a match
   * on the first (permanent) part of the ID.
   */
  const normalizedAddress = decodeURIComponent(addressId ?? '').split('?')[0];
  const address = addresses.find((address) =>
    address.id!.startsWith(normalizedAddress),
  );

  return (
    <>
      <Text className="mt-4 mb-6" as="h3" size="lead">
        {isNewAddress ? 'Add address' : 'Edit address'}
      </Text>
      <div className="max-w-lg">
        <Form method="post">
          <input
            type="hidden"
            name="addressId"
            value={address?.id ?? addressId}
          />
          {actionData?.formError && (
            <div className="flex items-center justify-center mb-6 bg-red-100 rounded">
              <p className="m-4 text-sm text-red-900">{actionData.formError}</p>
            </div>
          )}
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="firstName"
              name="firstName"
              required
              type="text"
              autoComplete="given-name"
              placeholder="First name"
              aria-label="First name"
              defaultValue={address?.firstName ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="lastName"
              name="lastName"
              required
              type="text"
              autoComplete="family-name"
              placeholder="Last name"
              aria-label="Last name"
              defaultValue={address?.lastName ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="company"
              name="company"
              type="text"
              autoComplete="organization"
              placeholder="Company"
              aria-label="Company"
              defaultValue={address?.company ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="address1"
              name="address1"
              type="text"
              autoComplete="address-line1"
              placeholder="Address line 1*"
              required
              aria-label="Address line 1"
              defaultValue={address?.address1 ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="address2"
              name="address2"
              type="text"
              autoComplete="address-line2"
              placeholder="Address line 2"
              aria-label="Address line 2"
              defaultValue={address?.address2 ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="city"
              name="city"
              type="text"
              required
              autoComplete="address-level2"
              placeholder="City"
              aria-label="City"
              defaultValue={address?.city ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="province"
              name="province"
              type="text"
              autoComplete="address-level1"
              placeholder="State / Province"
              required
              aria-label="State"
              defaultValue={address?.province ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="zip"
              name="zip"
              type="text"
              autoComplete="postal-code"
              placeholder="Zip / Postal Code"
              required
              aria-label="Zip"
              defaultValue={address?.zip ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="country"
              name="country"
              type="text"
              autoComplete="country-name"
              placeholder="Country"
              required
              aria-label="Country"
              defaultValue={address?.country ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Phone"
              aria-label="Phone"
              defaultValue={address?.phone ?? ''}
            />
          </div>
          <div className="mt-4">
            <input
              type="checkbox"
              name="defaultAddress"
              id="defaultAddress"
              defaultChecked={defaultAddress?.id === address?.id}
              className="border-gray-500 rounded-sm cursor-pointer border-1"
            />
            <label
              className="inline-block ml-2 text-sm cursor-pointer"
              htmlFor="defaultAddress"
            >
              Set as default address
            </label>
          </div>
          <div className="mt-8">
            <Button
              className="w-full rounded focus:shadow-outline"
              type="submit"
              variant="primary"
              disabled={transition.state !== 'idle'}
            >
              {transition.state !== 'idle' ? 'Saving' : 'Save'}
            </Button>
          </div>
          <div>
            <Button
              to=".."
              className="w-full mt-2 rounded focus:shadow-outline"
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
}
