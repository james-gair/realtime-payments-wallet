import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Contacts from '../pages/Contacts';

// Mock authFetch to return sample contacts
jest.mock('../services/firebaseFetch', () => ({
  authFetch: jest.fn(),
}));

import { authFetch } from '../services/firebaseFetch';

const mockContacts = [
  {
    id: 1,
    nickname: 'Ed',
    name: 'Edwin N',
    username: 'EN',
    email: 'edwinni@outlook.com.au',
    phone: '0481088688',
    contact_account_id: 4,
    added_by: 'username',
    added_value: '@EN',
    contact_type: 'sendit',
  },
  {
    id: 2,
    nickname: null,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: null,
    contact_account_id: null,
    added_by: 'email',
    added_value: 'john.doe@example.com',
    contact_type: 'payid',
  },
  {
    id: 3,
    nickname: 'Aussie Bank',
    name: 'James Johnson',
    email: 'bank@example.com',
    phone: null,
    contact_account_id: null,
    added_by: 'bank_account',
    added_value: '802985-12345678',
    bank_account: '802985-12345678',
    bsb: '802985',
    account_number: '12345678',
    contact_type: 'bank',
  },
];

function setupRouter(ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={["/contacts"]}>
      <Routes>
        <Route path="/contacts" element={ui} />
        <Route path="/add-contact" element={<div>Add Contact Page</div>} />
        <Route path="/contacts/:id" element={<div>Contact Details Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Contacts page', () => {
  beforeEach(() => {
    (authFetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockContacts,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('loads and displays contacts', async () => {
    setupRouter(<Contacts />);

    expect(await screen.findByText('Your Contacts')).toBeInTheDocument();
    // Shows at least one known contact
    expect(await screen.findByText('Ed')).toBeInTheDocument();
    expect(screen.getByText('Aussie Bank')).toBeInTheDocument();
  });

  it('filters by username, email, and phone via search', async () => {
    setupRouter(<Contacts />);

    const search = await screen.findByPlaceholderText('Name, username, email, phone');

    await userEvent.type(search, '@EN');
    expect(await screen.findByText('Ed')).toBeInTheDocument();

    // filter by email
    await userEvent.clear(search);
    await userEvent.type(search, 'john.doe@example.com');
    expect(await screen.findByText('John Doe')).toBeInTheDocument();

    // filter by phone (digit-only match)
    await userEvent.clear(search);
    await userEvent.type(search, '0481 088 688');
    expect(await screen.findByText('Ed')).toBeInTheDocument();
  });

  it('navigates to contact details when a contact is clicked', async () => {
    setupRouter(<Contacts />);

    const edRow = await screen.findByText('Ed');
    await userEvent.click(edRow);

    expect(await screen.findByText('Contact Details Page')).toBeInTheDocument();
  });

  it('navigates to add contact when Add New is clicked', async () => {
    setupRouter(<Contacts />);

    const addBtn = await screen.findByText('Add New');
    await userEvent.click(addBtn);
    expect(await screen.findByText('Add Contact Page')).toBeInTheDocument();
  });
});


