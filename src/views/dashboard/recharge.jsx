import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Button, MenuItem, Select, TextField, Typography, FormControl, InputLabel } from '@mui/material';
import { API_BASE_URL } from '../../config';

const RechargeForm = () => {
  const [tenantId, setTenantId] = useState('');
  const [amount, setAmount] = useState('');

  const auth = useSelector((state) => state.auth)
  console.log(auth.user)
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (amount < 5 || amount > 1000) {
      alert('Amount must be between 5 and 1000 kWh');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/recharge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId, amount }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      alert('Recharge successful');
    } catch (error) {
      console.error('There was an error recharging the tenant!', error);
      alert('Recharge failed');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        maxWidth: 400,
        margin: 'auto',
        padding: 3,
        border: '1px solid #ccc',
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Recharge Tenant
      </Typography>
      <FormControl fullWidth>
        <InputLabel id="tenant-id-label">Tenant ID</InputLabel>
        <Select
          labelId="tenant-id-label"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          required
        >
          <MenuItem value="tenant_01">Tenant 1</MenuItem>
          <MenuItem value="tenant_02">Tenant 2</MenuItem>
        </Select>
      </FormControl>
      <TextField
        label="Amount (kWh)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputProps={{ min: 5, max: 1000 }}
        required
        fullWidth
      />
      <Button type="submit" variant="contained" color="primary" fullWidth>
        Submit
      </Button>
    </Box>
  );
};

export default RechargeForm;