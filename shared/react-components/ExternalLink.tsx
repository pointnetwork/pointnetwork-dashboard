import {ReactEventHandler} from 'react';
// MUI
import {TypographyVariant} from '@mui/material';
import Typography from '@mui/material/Typography';

const ExternalLink = ({
    id,
    children,
    variant = 'body1',
    onClick
}: {
    id: string;
    children: string;
    variant?: TypographyVariant;
    onClick: ReactEventHandler;
}) => (
    <Typography
        id={id}
        variant={variant}
        color="primary"
        sx={{
            textDecoration: 'underline',
            cursor: 'pointer',
            display: 'inline'
        }}
        onClick={onClick}
    >
        {children}
    </Typography>
);

export default ExternalLink;
